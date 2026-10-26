import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import type { Prisma, PrismaClient } from '@prisma/client';

/**
 * One-time tokens for email verification and password reset (gpp add auth-flows).
 *
 * A token is `<id>.<secret>` with 32 random bytes of secret. Only a SHA-256 hash of the
 * secret is stored (auth_flow_tokens.token_hash); the id finds the row and the secret is
 * compared with the hash in constant time. Tokens expire, work once, and issuing a new
 * one for the same purpose retires the user's earlier ones.
 */

export const EMAIL_VERIFICATION = 'email_verification';
export const PASSWORD_RESET = 'password_reset';
export type TokenPurpose = typeof EMAIL_VERIFICATION | typeof PASSWORD_RESET;

type Db = PrismaClient | Prisma.TransactionClient;

const SECRET_BYTES = 32;
const MAX_TOKEN_LENGTH = 200;

function hashSecret(secret: string): Buffer {
  return createHash('sha256').update(secret).digest();
}

function positiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const verificationHours = () => positiveNumber(process.env.EMAIL_VERIFICATION_EXPIRE_HOURS, 24);
export const resetMinutes = () => positiveNumber(process.env.PASSWORD_RESET_EXPIRE_MINUTES, 60);

export function tokenLifetimeMs(purpose: TokenPurpose): number {
  return purpose === EMAIL_VERIFICATION ? verificationHours() * 3_600_000 : resetMinutes() * 60_000;
}

/** Mark every unused token of this purpose for the user as used. */
export async function invalidateTokens(db: Db, userId: string, purpose: TokenPurpose): Promise<void> {
  await db.authFlowToken.updateMany({
    where: { userId, purpose, usedAt: null },
    data: { usedAt: new Date() },
  });
}

/** Create a token (retiring the user's earlier ones of this purpose) and return it raw, for the email. */
export async function issueToken(db: Db, userId: string, purpose: TokenPurpose): Promise<string> {
  await invalidateTokens(db, userId, purpose);
  const secret = randomBytes(SECRET_BYTES).toString('base64url');
  const row = await db.authFlowToken.create({
    data: {
      userId,
      purpose,
      tokenHash: hashSecret(secret).toString('hex'),
      expiresAt: new Date(Date.now() + tokenLifetimeMs(purpose)),
    },
    select: { id: true },
  });
  return `${row.id}.${secret}`;
}

/**
 * Check a raw token and mark it used. Returns the user id, or null when the token is
 * malformed, unknown, for another purpose, wrong, expired or already used.
 */
export async function consumeToken(db: Db, raw: string, purpose: TokenPurpose): Promise<string | null> {
  if (raw.length > MAX_TOKEN_LENGTH) return null;
  const dot = raw.indexOf('.');
  const id = raw.slice(0, dot);
  const secret = raw.slice(dot + 1);
  if (dot <= 0 || !secret) return null;

  const row = await db.authFlowToken.findUnique({ where: { id } });
  if (!row || row.purpose !== purpose) return null;
  const expected = Buffer.from(row.tokenHash, 'hex');
  const actual = hashSecret(secret);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  const now = new Date();
  if (row.usedAt || row.expiresAt <= now) return null;

  // Conditional update: of two concurrent requests with the same token, one wins.
  const claimed = await db.authFlowToken.updateMany({
    where: { id: row.id, usedAt: null },
    data: { usedAt: now },
  });
  return claimed.count === 1 ? row.userId : null;
}
