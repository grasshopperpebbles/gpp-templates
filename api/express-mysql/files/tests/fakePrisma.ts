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
 *   tokens (ON DELETE CASCADE).
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
const clientVersion = Prisma.prismaVersion.client;

const users = new Map<string, UserRow>();
const refreshTokens = new Map<string, RefreshTokenRow>();
let sequence = 0;

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

export const fakePrisma = {
  user: {
    async findUnique({ where, select }: { where: Where; select?: Select<UserRow> }) {
      const user = find(where);
      return user ? pick(user, select) : null;
    },
    async findMany({
      skip = 0,
      take,
      select,
      orderBy,
    }: { skip?: number; take?: number; select?: Select<UserRow>; orderBy?: OrderBy } = {}) {
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
      return users.size;
    },
    async create({ data, select }: { data: Partial<UserRow> & { email: string }; select?: Select<UserRow> }) {
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
      users.set(user.id, user);
      return pick(user, select);
    },
    async update({ where, data, select }: { where: Where; data: Partial<UserRow>; select?: Select<UserRow> }) {
      checkKeys('data', Object.keys(data), WRITABLE);
      checkRole(data.role);
      const user = find(where);
      if (!user) throw notFound();
      if (data.email !== undefined) assertEmailFree(data.email, user.id);
      const changes = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
      Object.assign(user, changes, { updatedAt: new Date() });
      return pick(user, select);
    },
    async delete({ where }: { where: Where }) {
      const user = find(where);
      if (!user) throw notFound();
      users.delete(user.id);
      for (const row of [...refreshTokens.values()]) {
        if (row.userId === user.id) refreshTokens.delete(row.id); // ON DELETE CASCADE
      }
      return user;
    },
  },
  refreshToken: {
    async findUnique({ where, select }: { where: { id?: string; tokenHash?: string }; select?: Select<RefreshTokenRow> }) {
      checkKeys('where', Object.keys(where), ['id', 'tokenHash']);
      const row = where.id !== undefined
        ? refreshTokens.get(where.id)
        : [...refreshTokens.values()].find((r) => r.tokenHash === where.tokenHash);
      return row ? pickFrom(row, TOKEN_COLUMNS, select) : null;
    },
    async findMany({ where = {} }: { where?: TokenWhere } = {}) {
      return [...refreshTokens.values()].filter((r) => matchesToken(r, where)).map((r) => ({ ...r }));
    },
    async create({ data, select }: { data: Partial<RefreshTokenRow>; select?: Select<RefreshTokenRow> }) {
      checkKeys('data', Object.keys(data), TOKEN_WRITABLE);
      if (!data.tokenHash || !data.userId || !data.familyId || !(data.expiresAt instanceof Date)) {
        throw validationError('Argument `tokenHash`, `userId`, `familyId` or `expiresAt` is missing.');
      }
      if (!users.has(data.userId)) {
        throw new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed on the field: `user_id`', {
          code: 'P2003',
          clientVersion,
        });
      }
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
      refreshTokens.set(row.id, row);
      return pickFrom(row, TOKEN_COLUMNS, select);
    },
    async update({ where, data }: { where: { id: string }; data: Partial<RefreshTokenRow> }) {
      checkKeys('where', Object.keys(where), ['id']);
      checkKeys('data', Object.keys(data), TOKEN_WRITABLE);
      const row = refreshTokens.get(where.id);
      if (!row) throw notFound();
      Object.assign(row, data);
      return { ...row };
    },
    async updateMany({ where, data }: { where: TokenWhere; data: Partial<RefreshTokenRow> }) {
      checkKeys('data', Object.keys(data), TOKEN_WRITABLE);
      const rows = [...refreshTokens.values()].filter((r) => matchesToken(r, where));
      for (const row of rows) Object.assign(row, data);
      return { count: rows.length };
    },
    async deleteMany({ where }: { where: TokenWhere }) {
      const rows = [...refreshTokens.values()].filter((r) => matchesToken(r, where));
      for (const row of rows) refreshTokens.delete(row.id);
      return { count: rows.length };
    },
  },
  async $disconnect() {},
};

export function resetDb(): void {
  users.clear();
  refreshTokens.clear();
  sequence = 0;
}
