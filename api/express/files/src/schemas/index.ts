import { z } from 'zod';

/**
 * Example validation schemas
 * Add your own schemas here
 */

// Emails are trimmed and lowercased before they reach the database, so `A@X.com` and
// `a@x.com` are one account on PostgreSQL (case-sensitive) and MySQL alike.
// 191 = the VARCHAR(191) column Prisma uses for MySQL utf8mb4 unique indexes.
const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(191, 'Email must be at most 191 characters')
  .email('Invalid email address');

// bcrypt only uses the first 72 bytes of a password, so longer ones are rejected
// instead of being silently truncated (multi-byte characters count as several bytes).
const PASSWORD_MAX_BYTES = 72;
const withinBcryptLimit = (value: string) => Buffer.byteLength(value, 'utf8') <= PASSWORD_MAX_BYTES;
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(PASSWORD_MAX_BYTES, `Password must be at most ${PASSWORD_MAX_BYTES} characters`)
  .refine(withinBcryptLimit, `Password must be at most ${PASSWORD_MAX_BYTES} bytes (UTF-8)`);

// Roles (the Role enum in prisma/schema.prisma)
export const roleSchema = z.enum(['user', 'admin']);

// User schemas. Only POST /users (admin-only) accepts a role. registerSchema and
// updateUserSchema have none, and zod strips unknown keys, so nobody can set their own.
export const createUserSchema = z.object({
  email,
  name: z.string().min(1, 'Name is required').max(100),
  password,
  role: roleSchema.default('user'),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: email.optional(),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

// ID parameter schema (User ids are Prisma cuid() strings, see prisma/schema.prisma)
export const idParamSchema = z.object({
  id: z.string().cuid('Invalid ID format'),
});

// Auth schemas
export const loginSchema = z.object({
  email,
  password: z
    .string()
    .min(1, 'Password is required')
    .max(PASSWORD_MAX_BYTES)
    .refine(withinBcryptLimit, `Password must be at most ${PASSWORD_MAX_BYTES} bytes (UTF-8)`),
});

export const registerSchema = z.object({
  email,
  password,
  name: z.string().min(1, 'Name is required').max(100),
});

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
});

// Type exports
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type IdParam = z.infer<typeof idParamSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
