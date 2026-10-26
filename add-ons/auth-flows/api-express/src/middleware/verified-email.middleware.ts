import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { ApiError } from './error-handler.middleware.js';

/**
 * For routes that need a verified email address (gpp add auth-flows). Use after
 * `authenticate`: router.get('/billing', authenticate, requireVerifiedEmail, handler).
 * Answers 403 until the user has followed their verification link.
 */
export async function requireVerifiedEmail(req: Request, _res: Response, next: NextFunction) {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      throw new ApiError(401, 'Not authenticated');
    }
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { emailVerifiedAt: true } });
    if (!user?.emailVerifiedAt) {
      throw new ApiError(403, 'Please verify your email address first.');
    }
    next();
  } catch (error) {
    next(error);
  }
}
