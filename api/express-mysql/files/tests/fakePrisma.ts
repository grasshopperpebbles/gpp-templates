import { randomBytes } from 'crypto';

/**
 * In-memory stand-in for the Prisma client (only what the routes use), so tests
 * run without a database. tests/setup.ts swaps it in for src/lib/prisma.ts.
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

const users = new Map<string, UserRow>();

function pick(user: UserRow, select?: Select) {
  if (!select) return { ...user };
  return Object.fromEntries(
    Object.entries(user).filter(([key]) => select[key as keyof UserRow])
  );
}

function find(where: Where): UserRow | undefined {
  if (where.id) return users.get(where.id);
  return [...users.values()].find((u) => u.email === where.email);
}

function notFound(): Error {
  return Object.assign(new Error('Record to update not found.'), { code: 'P2025' });
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
      const user = find(where);
      if (!user) throw notFound();
      Object.assign(user, data, { updatedAt: new Date() });
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
