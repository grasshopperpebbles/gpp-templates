import { createHash, randomUUID } from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
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
 *
 * Each family also has a row in `refresh_token_families`. A rotation runs in one transaction
 * that first locks that row (and checks it is not revoked), and reuse detection revokes the
 * family row and its tokens while holding the same lock. So rotations and revocations of one
 * family run one after the other: a revocation either commits first (the rotation then sees
 * the revoked family and issues nothing) or starts after the rotation committed (and then
 * revokes the token that rotation issued). A family revoked for reuse never gains a live token.
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

type Db = Prisma.TransactionClient;

/** Sign a refresh token, store its hash and return the token with its row id. */
async function issueRefreshToken(db: Db, userId: string, familyId: string): Promise<{ token: string; id: string }> {
  // jti makes every token unique, even two issued for the same user in the same second.
  const token = jwt.sign({ sub: userId, type: 'refresh', jti: randomUUID() }, getJwtSecret(), {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
  const { exp } = jwt.decode(token) as { exp: number };
  const row = await db.refreshToken.create({
    data: { tokenHash: hashToken(token), userId, familyId, expiresAt: new Date(exp * 1000) },
    select: { id: true },
  });
  return { token, id: row.id };
}

/** P2034: the database aborted the transaction (deadlock or write conflict); it is safe to retry. */
function isWriteConflict(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034';
}

/** Run `run` again (up to `attempts` times in all) when it fails with a write conflict. */
async function withRetry<T>(run: () => Promise<T>, attempts = 3): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await run();
    } catch (err) {
      if (!isWriteConflict(err) || attempt >= attempts) throw err;
    }
  }
}

/**
 * Housekeeping at login: drop the user's expired rows and the families left without tokens.
 * Revoked-but-unexpired rows stay so reuse of them is still detected. Best effort: these
 * deletes can deadlock with the user's concurrent requests on MySQL, so a write conflict is
 * retried and then skipped (the next login prunes again).
 */
async function pruneUserTokens(userId: string): Promise<void> {
  try {
    await withRetry(async () => {
      await prisma.refreshToken.deleteMany({ where: { userId, expiresAt: { lt: new Date() } } });
      await prisma.refreshTokenFamily.deleteMany({ where: { userId, tokens: { none: {} } } });
    });
  } catch (err) {
    if (!isWriteConflict(err)) throw err;
    console.warn(`Skipped pruning the refresh tokens of user ${userId} (write conflict)`);
  }
}

/** New login (register or login): a fresh token family (see pruneUserTokens for cleanup). */
export async function issueTokenPair(user: { id: string; email: string }): Promise<TokenPair> {
  await pruneUserTokens(user.id);
  const refresh = await withRetry(() =>
    prisma.$transaction(async (tx) => {
      const family = await tx.refreshTokenFamily.create({ data: { userId: user.id }, select: { id: true } });
      return issueRefreshToken(tx, user.id, family.id);
    })
  );
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

/**
 * Lock the family row until the transaction ends. Every rotation and every reuse revocation
 * of a family starts here, so they cannot overlap. Returns false if the family is revoked
 * (or gone). The increment makes it a real write, so the row is locked on every database.
 */
async function lockFamily(tx: Db, familyId: string): Promise<boolean> {
  const { count } = await tx.refreshTokenFamily.updateMany({
    where: { id: familyId, revokedAt: null },
    data: { rotations: { increment: 1 } },
  });
  return count === 1;
}

/** Revoke the family and every token in it. Call only while holding the family lock. */
async function revokeFamily(tx: Db, familyId: string): Promise<void> {
  const now = new Date();
  await tx.refreshTokenFamily.update({ where: { id: familyId }, data: { revokedAt: now } });
  await tx.refreshToken.updateMany({ where: { familyId, revokedAt: null }, data: { revokedAt: now } });
}

type Rotation =
  | { outcome: 'rotated'; user: { id: string; email: string }; refreshToken: string }
  | { outcome: 'reused' | 'family-revoked' | 'no-user' };

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

  const result = await withRetry(() =>
    prisma.$transaction(async (tx): Promise<Rotation> => {
      if (!(await lockFamily(tx, row.familyId))) {
        return { outcome: 'family-revoked' };
      }

      // Claim the row with a conditional update: an already revoked token (rotated or logged
      // out) sees count 0 and is treated as reuse. The family lock is held, so no rotation of
      // this family is in flight: its replacement token, if any, is already committed and
      // revokeFamily revokes it too.
      const claimed = await tx.refreshToken.updateMany({
        where: { id: row.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (claimed.count === 0) {
        await revokeFamily(tx, row.familyId);
        return { outcome: 'reused' };
      }

      const user = await tx.user.findUnique({ where: { id: row.userId }, select: { id: true, email: true } });
      if (!user) {
        return { outcome: 'no-user' };
      }

      const next = await issueRefreshToken(tx, user.id, row.familyId);
      await tx.refreshToken.update({ where: { id: row.id }, data: { replacedById: next.id } });
      return { outcome: 'rotated', user, refreshToken: next.token };
    })
  );

  // Thrown after the transaction, so the revocation above is committed, not rolled back.
  switch (result.outcome) {
    case 'rotated':
      return { access_token: signAccessToken(result.user), refresh_token: result.refreshToken, token_type: 'bearer' };
    case 'no-user':
      throw new ApiError(401, 'User not found');
    case 'reused':
      console.warn(`Refresh token reuse detected for user ${row.userId}; revoked token family ${row.familyId}`);
      throw new ApiError(401, 'Refresh token has been revoked');
    case 'family-revoked':
      throw new ApiError(401, 'Refresh token has been revoked');
  }
}

/** Logout: revoke the presented refresh token. Idempotent for an already revoked token. */
export async function revokeRefreshToken(token: string): Promise<void> {
  verifyRefreshJwt(token);
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
