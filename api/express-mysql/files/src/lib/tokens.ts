import { createHash, randomUUID } from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from './prisma.js';
import { getJwtSecret } from '../middleware/auth.middleware.js';
import { ApiError } from '../middleware/error-handler.middleware.js';

/**
 * Access and refresh tokens.
 *
 * Access tokens are short-lived stateless JWTs. Refresh tokens are JWTs too (so the
 * `type: 'refresh'` check and expiry still apply), but every one is also stored in the
 * `refresh_tokens` table as a SHA-256 hash, which makes them single-use and revocable:
 *
 * - /auth/refresh revokes the presented token and issues a new pair; the new refresh
 *   token joins the same family (one family per login) and the old row points to it
 *   via `replacedById`.
 * - Presenting a revoked token again means it was copied (or replayed): the whole
 *   family is revoked, so both the thief and the real client must log in again.
 * - /auth/logout revokes the presented token.
 */

const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '1h') as SignOptions['expiresIn'];
const REFRESH_TOKEN_EXPIRES_IN = (process.env.REFRESH_TOKEN_EXPIRES_IN || '30d') as SignOptions['expiresIn'];

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
}

/** Only this hash is stored, so a leaked database does not leak usable refresh tokens. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function signAccessToken(user: { id: string; email: string }): string {
  return jwt.sign({ sub: user.id, email: user.email }, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
}

/** Sign a refresh token, store its hash and return the token with its row id. */
async function issueRefreshToken(userId: string, familyId: string): Promise<{ token: string; id: string }> {
  // jti makes every token unique, even two issued for the same user in the same second.
  const token = jwt.sign({ sub: userId, type: 'refresh', jti: randomUUID() }, getJwtSecret(), {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
  const { exp } = jwt.decode(token) as { exp: number };
  const row = await prisma.refreshToken.create({
    data: { tokenHash: hashToken(token), userId, familyId, expiresAt: new Date(exp * 1000) },
    select: { id: true },
  });
  return { token, id: row.id };
}

/**
 * New login (register or login): a fresh token family. Also drops the user's expired
 * rows; revoked-but-unexpired rows stay so reuse of them is still detected.
 */
export async function issueTokenPair(user: { id: string; email: string }): Promise<TokenPair> {
  await prisma.refreshToken.deleteMany({ where: { userId: user.id, expiresAt: { lt: new Date() } } });
  const refresh = await issueRefreshToken(user.id, randomUUID());
  return { access_token: signAccessToken(user), refresh_token: refresh.token, token_type: 'bearer' };
}

/** Signature, expiry and `type: 'refresh'` check. Throws 401. */
function verifyRefreshJwt(token: string): { sub: string } {
  let payload: unknown;
  try {
    payload = jwt.verify(token, getJwtSecret());
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }
  const { sub, type } = (payload ?? {}) as { sub?: unknown; type?: unknown };
  if (typeof payload !== 'object' || type !== 'refresh' || typeof sub !== 'string') {
    throw new ApiError(401, 'Invalid refresh token');
  }
  return { sub };
}

async function revokeFamily(familyId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { familyId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Exchange a refresh token for a new pair. The presented token is revoked; presenting a
 * token that is already revoked revokes its whole family. Throws 401.
 */
export async function rotateRefreshToken(token: string): Promise<TokenPair> {
  const { sub } = verifyRefreshJwt(token);

  const row = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(token) } });
  // No row: never issued by this server, issued before rotation existed, or the user
  // was deleted (rows cascade).
  if (!row || row.userId !== sub || row.expiresAt <= new Date()) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  // Claim the row with a conditional update: an already revoked token, or the loser of
  // two concurrent requests with the same token, sees count 0 and is treated as reuse.
  const claimed = await prisma.refreshToken.updateMany({
    where: { id: row.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (claimed.count === 0) {
    await revokeFamily(row.familyId);
    console.warn(`Refresh token reuse detected for user ${row.userId}; revoked token family ${row.familyId}`);
    throw new ApiError(401, 'Refresh token has been revoked');
  }

  const user = await prisma.user.findUnique({ where: { id: row.userId }, select: { id: true, email: true } });
  if (!user) {
    throw new ApiError(401, 'User not found');
  }

  const next = await issueRefreshToken(user.id, row.familyId);
  await prisma.refreshToken.update({ where: { id: row.id }, data: { replacedById: next.id } });

  return { access_token: signAccessToken(user), refresh_token: next.token, token_type: 'bearer' };
}

/** Logout: revoke the presented refresh token. Idempotent for an already revoked token. */
export async function revokeRefreshToken(token: string): Promise<void> {
  verifyRefreshJwt(token);
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
