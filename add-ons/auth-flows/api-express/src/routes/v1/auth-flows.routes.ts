import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import prisma from '../../lib/prisma.js';
import {
  EMAIL_VERIFICATION,
  PASSWORD_RESET,
  consumeToken,
  invalidateTokens,
  issueToken,
  resetMinutes,
  verificationHours,
} from '../../lib/auth-flow-tokens.js';
import { sendPasswordResetEmail, sendVerificationEmail } from '../../lib/email.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { asyncHandler, ApiError } from '../../middleware/error-handler.middleware.js';

/**
 * Email verification and password reset (gpp add auth-flows), mounted at /api/v1/auth
 * ahead of the pack's auth routes:
 *
 *   POST /verify-email          { token }            mark the email verified
 *   POST /resend-verification   { email }            email a new verification link
 *   POST /forgot-password       { email }            email a password reset link
 *   POST /reset-password        { token, password }  set a new password, sign out everywhere
 *   GET  /verification-status   (Bearer token)       { email, email_verified, email_verified_at }
 *
 * Registration stays on the pack's POST /auth/register; the hook below only watches its
 * response and emails the verification link after a 201. Login is not blocked for
 * unverified users; use requireVerifiedEmail (middleware/verified-email.middleware.ts)
 * on routes that need a verified address.
 */

const router: Router = Router();

const BCRYPT_ROUNDS = 10;

// The same answer whether or not the email has an account.
const RESEND_MESSAGE = 'If that account exists and is not verified yet, we sent a new verification link.';
const FORGOT_MESSAGE = 'If an account exists for that email, we sent a password reset link.';

// Same normalization and limits as the pack's schemas (src/schemas/index.ts).
const email = z.string().trim().toLowerCase().max(191).email('Invalid email address');
const token = z.string().min(1, 'Token is required').max(200);
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password must be at most 72 bytes (UTF-8)');

const emailSchema = z.object({ email });
const tokenSchema = z.object({ token });
const resetPasswordSchema = z.object({ token, password });

/** The Prisma client must include the AuthFlowToken model (run `npx prisma generate`). */
function hasAuthFlowModel(): boolean {
  return Boolean((prisma as unknown as Record<string, unknown>).authFlowToken);
}

async function sendVerification(user: { id: string; email: string; name: string | null }): Promise<void> {
  const raw = await issueToken(prisma, user.id, EMAIL_VERIFICATION);
  await sendVerificationEmail(user.email, user.name, raw, verificationHours());
}

/**
 * Watch the pack's POST /auth/register: after it answers 201 with { data: { user } },
 * email that user a verification link. The request itself is handled by the pack.
 */
router.post('/register', (_req: Request, res: Response, next: NextFunction) => {
  const json = res.json.bind(res);
  res.json = ((body?: unknown) => {
    const user = (body as { data?: { user?: { id?: unknown; email?: unknown; name?: unknown } } })?.data?.user;
    if (res.statusCode === 201 && typeof user?.id === 'string' && typeof user.email === 'string') {
      if (!hasAuthFlowModel()) {
        console.warn('auth-flows: Prisma client has no AuthFlowToken model; run `npx prisma generate`');
      } else {
        const name = typeof user.name === 'string' ? user.name : null;
        sendVerification({ id: user.id, email: user.email, name }).catch((error) =>
          console.error('auth-flows: could not send the verification email after register:', error)
        );
      }
    }
    return json(body);
  }) as Response['json'];
  next();
});

router.post(
  '/verify-email',
  validate(tokenSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const verified = await prisma.$transaction(async (tx) => {
      const userId = await consumeToken(tx, req.body.token, EMAIL_VERIFICATION);
      if (!userId) return false;
      await tx.user.updateMany({
        where: { id: userId, emailVerifiedAt: null },
        data: { emailVerifiedAt: new Date() },
      });
      await invalidateTokens(tx, userId, EMAIL_VERIFICATION);
      return true;
    });
    if (!verified) {
      throw new ApiError(400, 'This verification link is invalid or has expired.');
    }
    res.json({ success: true, data: { message: 'Your email address is verified.' } });
  })
);

router.post(
  '/resend-verification',
  validate(emailSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { email: req.body.email },
      select: { id: true, email: true, name: true, emailVerifiedAt: true },
    });
    if (user && !user.emailVerifiedAt) {
      const raw = await issueToken(prisma, user.id, EMAIL_VERIFICATION);
      // After the response, so timing doesn't reveal whether the account exists
      void sendVerificationEmail(user.email, user.name, raw, verificationHours());
    }
    res.json({ success: true, data: { message: RESEND_MESSAGE } });
  })
);

router.post(
  '/forgot-password',
  validate(emailSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { email: req.body.email },
      select: { id: true, email: true, name: true },
    });
    if (user) {
      const raw = await issueToken(prisma, user.id, PASSWORD_RESET);
      void sendPasswordResetEmail(user.email, user.name, raw, resetMinutes());
    }
    res.json({ success: true, data: { message: FORGOT_MESSAGE } });
  })
);

/** Revoke every refresh token (and, on pack versions that have them, token families). */
async function revokeRefreshTokens(tx: Prisma.TransactionClient, userId: string): Promise<void> {
  const now = new Date();
  const families = (tx as unknown as {
    refreshTokenFamily?: { updateMany(args: { where: object; data: object }): Promise<unknown> };
  }).refreshTokenFamily;
  if (families) {
    await families.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: now } });
  }
  await tx.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: now } });
}

router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const hashedPassword = await bcrypt.hash(req.body.password, BCRYPT_ROUNDS);
    const reset = await prisma.$transaction(async (tx) => {
      const userId = await consumeToken(tx, req.body.token, PASSWORD_RESET);
      if (!userId) return false;
      const user = await tx.user.findUnique({ where: { id: userId }, select: { emailVerifiedAt: true } });
      if (!user) return false;
      await tx.user.update({
        where: { id: userId },
        // The link reached the user's inbox, so the address is theirs.
        data: { password: hashedPassword, ...(user.emailVerifiedAt ? {} : { emailVerifiedAt: new Date() }) },
      });
      await invalidateTokens(tx, userId, PASSWORD_RESET);
      await revokeRefreshTokens(tx, userId);
      return true;
    });
    if (!reset) {
      throw new ApiError(400, 'This password reset link is invalid or has expired.');
    }
    res.json({
      success: true,
      data: { message: 'Your password has been reset. Sign in with your new password.' },
    });
  })
);

router.get(
  '/verification-status',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.userId },
      select: { email: true, emailVerifiedAt: true },
    });
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    res.json({
      success: true,
      data: {
        email: user.email,
        email_verified: user.emailVerifiedAt !== null,
        email_verified_at: user.emailVerifiedAt,
      },
    });
  })
);

export default router;
