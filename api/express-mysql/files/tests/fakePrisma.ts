import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';

/**
 * In-memory stand-in for the Prisma client (only what the routes use), so tests
 * run without a database. tests/setup.ts swaps it in for src/lib/prisma.ts.
 *
 * It is deliberately strict, so bugs show up here instead of against a real database:
 * - errors are real Prisma error classes (P2002 unique violation, P2025 not found,
 *   PrismaClientValidationError for unknown fields), so the error handler maps them
 *   exactly as it would in production;
 * - `email` is unique case-insensitively on create AND update (the MySQL collation
 *   behaves this way; on PostgreSQL the zod schemas lowercase emails so both agree);
 * - `findUnique({ where: { email } })` matches exactly (like PostgreSQL), so a route
 *   that forgets to normalize an email fails its test;
 * - `role` only accepts the Role enum values, and deleting a user deletes their refresh
 *   tokens and token families (ON DELETE CASCADE); a refresh token needs an existing user
 *   and family (foreign keys).
 *
 * Concurrency is modelled too, so races show up instead of being hidden by in-memory speed:
 * - every operation first yields to the event loop (like a database round trip), so two
 *   concurrent requests interleave between operations;
 * - `$transaction(fn)` runs `fn` with a transaction client. Its writes are rolled back if
 *   `fn` throws. A refresh token family row is locked by `refreshTokenFamily.updateMany` /
 *   `update` / `deleteMany` (as UPDATE and DELETE lock the row in PostgreSQL and MySQL):
 *   inside a transaction the lock is held until it ends, and other writers of that row wait
 *   for it, then re-check their `where` against the committed row. Other rows are not locked.
 * - `fakeHooks.beforeRefreshTokenCreate` lets a test pause a request just before it inserts
 *   a refresh token, to force a specific interleaving.
 */
interface UserRow {
  id: string;
  email: string;
  name: string | null;
  password: string | null;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

interface RefreshTokenRow {
  id: string;
  tokenHash: string;
  userId: string;
  familyId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedById: string | null;
  createdAt: Date;
}

interface FamilyRow {
  id: string;
  userId: string;
  revokedAt: Date | null;
  rotations: number;
  createdAt: Date;
}

type Select<Row> = Partial<Record<keyof Row, boolean>>;
type Where = { id?: string; email?: string };
type OrderBy = Partial<Record<keyof UserRow, 'asc' | 'desc'>>;

const COLUMNS: (keyof UserRow)[] = ['id', 'email', 'name', 'password', 'role', 'createdAt', 'updatedAt'];
const WRITABLE: (keyof UserRow)[] = ['email', 'name', 'password', 'role'];
const ROLES = ['user', 'admin'];
const TOKEN_COLUMNS: (keyof RefreshTokenRow)[] = [
  'id', 'tokenHash', 'userId', 'familyId', 'expiresAt', 'revokedAt', 'replacedById', 'createdAt',
];
const TOKEN_WRITABLE: (keyof RefreshTokenRow)[] = ['tokenHash', 'userId', 'familyId', 'expiresAt', 'revokedAt', 'replacedById'];
const FAMILY_COLUMNS: (keyof FamilyRow)[] = ['id', 'userId', 'revokedAt', 'rotations', 'createdAt'];
const FAMILY_WRITABLE: (keyof FamilyRow)[] = ['userId', 'revokedAt', 'rotations'];
const clientVersion = Prisma.prismaVersion.client;

const users = new Map<string, UserRow>();
const refreshTokens = new Map<string, RefreshTokenRow>();
const families = new Map<string, FamilyRow>();
let sequence = 0;

export const fakeHooks: { beforeRefreshTokenCreate?: () => Promise<void> } = {};

/** A database round trip: lets other pending requests run before this operation. */
const roundTrip = () => new Promise<void>((resolve) => setImmediate(resolve));

// ---- transactions and family row locks ----------------------------------------------

interface Tx {
  /** Family ids locked by this transaction, with the function that releases each lock. */
  locks: Map<string, () => void>;
  /** Restores rows changed by this transaction, newest change last. */
  undo: (() => void)[];
}

/** family id -> settles when the current holder releases the lock */
const familyLocks = new Map<string, Promise<void>>();

async function acquireFamilyLock(id: string): Promise<() => void> {
  while (familyLocks.has(id)) await familyLocks.get(id);
  let release!: () => void;
  familyLocks.set(id, new Promise<void>((resolve) => (release = resolve)));
  return () => {
    familyLocks.delete(id);
    release();
  };
}

/** Lock a family row: until the transaction ends, or (outside one) until `write` is done. */
async function withFamilyLock<T>(tx: Tx | undefined, id: string, write: () => T): Promise<T> {
  if (!tx) {
    const release = await acquireFamilyLock(id);
    try {
      return write();
    } finally {
      release();
    }
  }
  if (!tx.locks.has(id)) tx.locks.set(id, await acquireFamilyLock(id));
  return write();
}

/** Record a row's current state (or absence) so a failed transaction can restore it. */
function remember<Row extends object>(tx: Tx | undefined, map: Map<string, Row>, id: string): void {
  if (!tx) return;
  const saved = map.get(id);
  const copy = saved && { ...saved };
  tx.undo.push(() => {
    if (copy) map.set(id, copy);
    else map.delete(id);
  });
}

// ---- helpers --------------------------------------------------------------------------

function validationError(message: string): Error {
  return new Prisma.PrismaClientValidationError(message, { clientVersion });
}

function checkKeys(kind: string, keys: string[], allowed: readonly string[]): void {
  const unknown = keys.filter((key) => !allowed.includes(key));
  if (unknown.length) throw validationError(`Unknown argument in ${kind}: ${unknown.join(', ')}`);
}

function checkRole(role: unknown): void {
  if (role !== undefined && !ROLES.includes(role as string)) {
    throw validationError('Invalid value for argument `role`. Expected Role.');
  }
}

function pickFrom<Row extends object>(row: Row, columns: readonly string[], select?: Select<Row>) {
  if (!select) return { ...row };
  checkKeys('select', Object.keys(select), columns);
  return Object.fromEntries(Object.entries(row).filter(([key]) => select[key as keyof Row]));
}

const pick = (user: UserRow, select?: Select<UserRow>) => pickFrom(user, COLUMNS, select);

function find(where: Where): UserRow | undefined {
  checkKeys('where', Object.keys(where), ['id', 'email']);
  if (where.id !== undefined) return users.get(where.id);
  if (where.email !== undefined) return [...users.values()].find((u) => u.email === where.email);
  throw validationError('findUnique needs a unique field in where');
}

function notFound(): Error {
  return new Prisma.PrismaClientKnownRequestError('Record to update or delete does not exist.', {
    code: 'P2025',
    clientVersion,
  });
}

function uniqueViolation(field: string): Error {
  return new Prisma.PrismaClientKnownRequestError(`Unique constraint failed on the fields: (\`${field}\`)`, {
    code: 'P2002',
    clientVersion,
    meta: { target: [field] },
  });
}

function foreignKeyViolation(field: string): Error {
  return new Prisma.PrismaClientKnownRequestError(`Foreign key constraint failed on the field: \`${field}\``, {
    code: 'P2003',
    clientVersion,
  });
}

function assertEmailFree(email: string, exceptId?: string): void {
  const taken = [...users.values()].some(
    (u) => u.id !== exceptId && u.email.toLowerCase() === email.toLowerCase()
  );
  if (taken) throw uniqueViolation('email');
}

function cuid(): string {
  return `c${randomBytes(12).toString('hex')}`; // cuid-shaped
}

// refreshToken where filters: equality on any column (incl. null) or `{ lt: Date }`.
type TokenWhere = Partial<Record<keyof RefreshTokenRow, unknown>>;

function matchesToken(row: RefreshTokenRow, where: TokenWhere): boolean {
  checkKeys('where', Object.keys(where), TOKEN_COLUMNS);
  return Object.entries(where).every(([key, condition]) => {
    const value = row[key as keyof RefreshTokenRow];
    if (condition instanceof Date) return value instanceof Date && value.getTime() === condition.getTime();
    if (condition && typeof condition === 'object') {
      checkKeys(`where.${key}`, Object.keys(condition), ['lt']);
      return value instanceof Date && value < (condition as { lt: Date }).lt;
    }
    return value === condition;
  });
}

// refreshTokenFamily where filters: equality on a column, or `tokens: { none: {} }`.
type FamilyWhere = Partial<Record<keyof FamilyRow, unknown>> & { tokens?: { none: Record<string, never> } };

function matchesFamily(row: FamilyRow, where: FamilyWhere): boolean {
  checkKeys('where', Object.keys(where), [...FAMILY_COLUMNS, 'tokens']);
  return Object.entries(where).every(([key, condition]) => {
    if (key === 'tokens') {
      const filter = condition as Record<string, unknown>;
      checkKeys('where.tokens', Object.keys(filter), ['none']);
      checkKeys('where.tokens.none', Object.keys(filter.none as object), []);
      return ![...refreshTokens.values()].some((t) => t.familyId === row.id);
    }
    return row[key as keyof FamilyRow] === condition;
  });
}

/** Family data: plain values, or `{ increment: n }` for `rotations`. */
function applyFamilyData(row: FamilyRow, data: Record<string, unknown>): void {
  checkKeys('data', Object.keys(data), FAMILY_WRITABLE);
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      checkKeys(`data.${key}`, Object.keys(value), ['increment']);
      if (key !== 'rotations') throw validationError(`\`increment\` is not valid for ${key}`);
      row.rotations += (value as { increment: number }).increment;
    } else {
      (row as unknown as Record<string, unknown>)[key] = value;
    }
  }
}

// ---- the client -----------------------------------------------------------------------

function makeClient(tx?: Tx) {
  return {
    user: {
      async findUnique({ where, select }: { where: Where; select?: Select<UserRow> }) {
        await roundTrip();
        const user = find(where);
        return user ? pick(user, select) : null;
      },
      async findMany({
        skip = 0,
        take,
        select,
        orderBy,
      }: { skip?: number; take?: number; select?: Select<UserRow>; orderBy?: OrderBy } = {}) {
        await roundTrip();
        const all = [...users.values()];
        if (orderBy) {
          checkKeys('orderBy', Object.keys(orderBy), COLUMNS);
          const [[key, direction]] = Object.entries(orderBy) as [keyof UserRow, 'asc' | 'desc'][];
          all.sort((a, b) => {
            const [x, y] = [a[key] ?? '', b[key] ?? ''];
            const order = x < y ? -1 : x > y ? 1 : 0;
            return direction === 'desc' ? -order : order;
          });
        }
        return all.slice(skip, take === undefined ? undefined : skip + take).map((u) => pick(u, select));
      },
      async count() {
        await roundTrip();
        return users.size;
      },
      async create({ data, select }: { data: Partial<UserRow> & { email: string }; select?: Select<UserRow> }) {
        await roundTrip();
        checkKeys('data', Object.keys(data), WRITABLE);
        if (typeof data.email !== 'string') throw validationError('Argument `email` is missing.');
        checkRole(data.role);
        assertEmailFree(data.email);
        // Distinct timestamps keep `orderBy: { createdAt }` deterministic within a test.
        const now = new Date(Date.now() + sequence++);
        const user: UserRow = {
          id: cuid(),
          email: data.email,
          name: data.name ?? null,
          password: data.password ?? null,
          role: data.role ?? 'user',
          createdAt: now,
          updatedAt: now,
        };
        remember(tx, users, user.id);
        users.set(user.id, user);
        return pick(user, select);
      },
      async update({ where, data, select }: { where: Where; data: Partial<UserRow>; select?: Select<UserRow> }) {
        await roundTrip();
        checkKeys('data', Object.keys(data), WRITABLE);
        checkRole(data.role);
        const user = find(where);
        if (!user) throw notFound();
        if (data.email !== undefined) assertEmailFree(data.email, user.id);
        const changes = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
        remember(tx, users, user.id);
        Object.assign(user, changes, { updatedAt: new Date() });
        return pick(user, select);
      },
      async delete({ where }: { where: Where }) {
        await roundTrip();
        const user = find(where);
        if (!user) throw notFound();
        remember(tx, users, user.id);
        users.delete(user.id);
        // ON DELETE CASCADE
        for (const row of [...refreshTokens.values()]) {
          if (row.userId !== user.id) continue;
          remember(tx, refreshTokens, row.id);
          refreshTokens.delete(row.id);
        }
        for (const family of [...families.values()]) {
          if (family.userId !== user.id) continue;
          remember(tx, families, family.id);
          families.delete(family.id);
        }
        return user;
      },
    },
    refreshTokenFamily: {
      async findMany({ where = {} }: { where?: FamilyWhere } = {}) {
        await roundTrip();
        return [...families.values()].filter((f) => matchesFamily(f, where)).map((f) => ({ ...f }));
      },
      async create({ data, select }: { data: { userId: string }; select?: Select<FamilyRow> }) {
        await roundTrip();
        checkKeys('data', Object.keys(data), ['userId']);
        if (!users.has(data.userId)) throw foreignKeyViolation('user_id');
        const row: FamilyRow = { id: cuid(), userId: data.userId, revokedAt: null, rotations: 0, createdAt: new Date() };
        remember(tx, families, row.id);
        families.set(row.id, row);
        return pickFrom(row, FAMILY_COLUMNS, select);
      },
      async update({ where, data }: { where: { id: string }; data: Record<string, unknown> }) {
        await roundTrip();
        checkKeys('where', Object.keys(where), ['id']);
        return withFamilyLock(tx, where.id, () => {
          const row = families.get(where.id);
          if (!row) throw notFound();
          remember(tx, families, row.id);
          applyFamilyData(row, data);
          return { ...row };
        });
      },
      async updateMany({ where, data }: { where: FamilyWhere & { id: string }; data: Record<string, unknown> }) {
        await roundTrip();
        if (typeof where.id !== 'string') throw validationError('fake refreshTokenFamily.updateMany needs where.id');
        // Wait for the row lock, then evaluate `where` against the committed row.
        return withFamilyLock(tx, where.id, () => {
          const row = families.get(where.id);
          if (!row || !matchesFamily(row, where)) return { count: 0 };
          remember(tx, families, row.id);
          applyFamilyData(row, data);
          return { count: 1 };
        });
      },
      async deleteMany({ where }: { where: FamilyWhere }) {
        await roundTrip();
        const rows = [...families.values()].filter((f) => matchesFamily(f, where));
        let count = 0;
        for (const candidate of rows) {
          count += await withFamilyLock(tx, candidate.id, () => {
            const row = families.get(candidate.id);
            if (!row || !matchesFamily(row, where)) return 0;
            remember(tx, families, row.id);
            families.delete(row.id);
            for (const token of [...refreshTokens.values()]) {
              if (token.familyId !== row.id) continue; // ON DELETE CASCADE
              remember(tx, refreshTokens, token.id);
              refreshTokens.delete(token.id);
            }
            return 1;
          });
        }
        return { count };
      },
    },
    refreshToken: {
      async findUnique({ where, select }: { where: { id?: string; tokenHash?: string }; select?: Select<RefreshTokenRow> }) {
        await roundTrip();
        checkKeys('where', Object.keys(where), ['id', 'tokenHash']);
        const row = where.id !== undefined
          ? refreshTokens.get(where.id)
          : [...refreshTokens.values()].find((r) => r.tokenHash === where.tokenHash);
        return row ? pickFrom(row, TOKEN_COLUMNS, select) : null;
      },
      async findMany({ where = {} }: { where?: TokenWhere } = {}) {
        await roundTrip();
        return [...refreshTokens.values()].filter((r) => matchesToken(r, where)).map((r) => ({ ...r }));
      },
      async create({ data, select }: { data: Partial<RefreshTokenRow>; select?: Select<RefreshTokenRow> }) {
        await roundTrip();
        await fakeHooks.beforeRefreshTokenCreate?.();
        checkKeys('data', Object.keys(data), TOKEN_WRITABLE);
        if (!data.tokenHash || !data.userId || !data.familyId || !(data.expiresAt instanceof Date)) {
          throw validationError('Argument `tokenHash`, `userId`, `familyId` or `expiresAt` is missing.');
        }
        if (!users.has(data.userId)) throw foreignKeyViolation('user_id');
        if (!families.has(data.familyId)) throw foreignKeyViolation('family_id');
        if ([...refreshTokens.values()].some((r) => r.tokenHash === data.tokenHash)) throw uniqueViolation('token_hash');
        const row: RefreshTokenRow = {
          id: cuid(),
          tokenHash: data.tokenHash,
          userId: data.userId,
          familyId: data.familyId,
          expiresAt: data.expiresAt,
          revokedAt: data.revokedAt ?? null,
          replacedById: data.replacedById ?? null,
          createdAt: new Date(),
        };
        remember(tx, refreshTokens, row.id);
        refreshTokens.set(row.id, row);
        return pickFrom(row, TOKEN_COLUMNS, select);
      },
      async update({ where, data }: { where: { id: string }; data: Partial<RefreshTokenRow> }) {
        await roundTrip();
        checkKeys('where', Object.keys(where), ['id']);
        checkKeys('data', Object.keys(data), TOKEN_WRITABLE);
        const row = refreshTokens.get(where.id);
        if (!row) throw notFound();
        remember(tx, refreshTokens, row.id);
        Object.assign(row, data);
        return { ...row };
      },
      async updateMany({ where, data }: { where: TokenWhere; data: Partial<RefreshTokenRow> }) {
        await roundTrip();
        checkKeys('data', Object.keys(data), TOKEN_WRITABLE);
        const rows = [...refreshTokens.values()].filter((r) => matchesToken(r, where));
        for (const row of rows) {
          remember(tx, refreshTokens, row.id);
          Object.assign(row, data);
        }
        return { count: rows.length };
      },
      async deleteMany({ where }: { where: TokenWhere }) {
        await roundTrip();
        const rows = [...refreshTokens.values()].filter((r) => matchesToken(r, where));
        for (const row of rows) {
          remember(tx, refreshTokens, row.id);
          refreshTokens.delete(row.id);
        }
        return { count: rows.length };
      },
    },
  };
}

type TxClient = ReturnType<typeof makeClient>;

export const fakePrisma = {
  ...makeClient(),
  /** Interactive transaction: rolled back if `fn` throws; family locks are held until it ends. */
  async $transaction<T>(fn: (tx: TxClient) => Promise<T>): Promise<T> {
    if (typeof fn !== 'function') throw validationError('fake $transaction supports only the callback form');
    const tx: Tx = { locks: new Map(), undo: [] };
    try {
      return await fn(makeClient(tx));
    } catch (err) {
      for (const restore of tx.undo.reverse()) restore();
      throw err;
    } finally {
      for (const release of tx.locks.values()) release();
    }
  },
  async $disconnect() {},
};

export function resetDb(): void {
  users.clear();
  refreshTokens.clear();
  families.clear();
  familyLocks.clear();
  sequence = 0;
  delete fakeHooks.beforeRefreshTokenCreate;
}
