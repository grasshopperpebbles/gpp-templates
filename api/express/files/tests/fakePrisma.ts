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
 *   that forgets to normalize an email fails its test.
 */
interface UserRow {
  id: string;
  email: string;
  name: string | null;
  password: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type Select = Partial<Record<keyof UserRow, boolean>>;
type Where = { id?: string; email?: string };

const COLUMNS: (keyof UserRow)[] = ['id', 'email', 'name', 'password', 'createdAt', 'updatedAt'];
const WRITABLE: (keyof UserRow)[] = ['email', 'name', 'password'];
const clientVersion = Prisma.prismaVersion.client;

const users = new Map<string, UserRow>();

function validationError(message: string): Error {
  return new Prisma.PrismaClientValidationError(message, { clientVersion });
}

function checkKeys(kind: string, keys: string[], allowed: readonly string[]): void {
  const unknown = keys.filter((key) => !allowed.includes(key));
  if (unknown.length) throw validationError(`Unknown argument in ${kind}: ${unknown.join(', ')}`);
}

function pick(user: UserRow, select?: Select) {
  if (!select) return { ...user };
  checkKeys('select', Object.keys(select), COLUMNS);
  return Object.fromEntries(Object.entries(user).filter(([key]) => select[key as keyof UserRow]));
}

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

function assertEmailFree(email: string, exceptId?: string): void {
  const taken = [...users.values()].some(
    (u) => u.id !== exceptId && u.email.toLowerCase() === email.toLowerCase()
  );
  if (taken) {
    throw new Prisma.PrismaClientKnownRequestError('Unique constraint failed on the fields: (`email`)', {
      code: 'P2002',
      clientVersion,
      meta: { target: ['email'] },
    });
  }
}

export const fakePrisma = {
  user: {
    async findUnique({ where, select }: { where: Where; select?: Select }) {
      const user = find(where);
      return user ? pick(user, select) : null;
    },
    async findMany({ skip = 0, take, select }: { skip?: number; take?: number; select?: Select } = {}) {
      const all = [...users.values()];
      return all.slice(skip, take === undefined ? undefined : skip + take).map((u) => pick(u, select));
    },
    async count() {
      return users.size;
    },
    async create({ data, select }: { data: Partial<UserRow> & { email: string }; select?: Select }) {
      checkKeys('data', Object.keys(data), WRITABLE);
      if (typeof data.email !== 'string') throw validationError('Argument `email` is missing.');
      assertEmailFree(data.email);
      const now = new Date();
      const user: UserRow = {
        id: `c${randomBytes(12).toString('hex')}`, // cuid-shaped
        email: data.email,
        name: data.name ?? null,
        password: data.password ?? null,
        createdAt: now,
        updatedAt: now,
      };
      users.set(user.id, user);
      return pick(user, select);
    },
    async update({ where, data, select }: { where: Where; data: Partial<UserRow>; select?: Select }) {
      checkKeys('data', Object.keys(data), WRITABLE);
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
      return user;
    },
  },
  async $disconnect() {},
};

export function resetDb(): void {
  users.clear();
}
