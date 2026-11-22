import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import prisma from '../../lib/prisma.js';
import { issueTokenPair, revokeRefreshToken, rotateRefreshToken } from '../../lib/tokens.js';
import { validate } from '../../middleware/validation.middleware.js';
import { asyncHandler, ApiError } from '../../middleware/error-handler.middleware.js';
import { loginSchema, registerSchema, refreshTokenSchema } from '../../schemas/index.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router: Router = Router();

export const BCRYPT_ROUNDS = 10;

// Login compares against this when the email is unknown, so a missing account costs the
// same bcrypt work as a wrong password and response times don't reveal which emails exist.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(randomBytes(16).toString('hex'), BCRYPT_ROUNDS);

/**
 * POST /api/v1/auth/register
 * Register a new user. Always role "user": registerSchema has no role field (an extra
 * `role` in the body is stripped), see README "Roles" for making an admin.
 */
router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new ApiError(409, 'User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        user,
        ...(await issueTokenPair(user)),
      },
    });
  })
);

/**
 * POST /api/v1/auth/login
 * Login with email and password
 */
router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always run one bcrypt comparison (against a dummy hash when there is no account)
    const validPassword = await bcrypt.compare(password, user?.password ?? DUMMY_PASSWORD_HASH);
    if (!user || !user.password || !validPassword) {
      throw new ApiError(401, 'Invalid email or password');
    }

    res.json({
      success: true,
      data: await issueTokenPair(user),
    });
  })
);

/**
 * POST /api/v1/auth/refresh
 * Exchange a refresh token for a new access + refresh token pair. The presented refresh
 * token is revoked; presenting it again revokes every token of that login (its family).
 */
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.json({
      success: true,
      data: await rotateRefreshToken(req.body.refresh_token),
    });
  })
);

/**
 * POST /api/v1/auth/logout
 * Revoke a refresh token. Needs only the refresh token (the access token may already have
 * expired); access tokens stay valid until they expire (JWT_EXPIRES_IN).
 */
router.post(
  '/logout',
  validate(refreshTokenSchema),
  asyncHandler(async (req: Request, res: Response) => {
    await revokeRefreshToken(req.body.refresh_token);

    res.json({
      success: true,
      message: 'Logged out',
    });
  })
);

/**
 * GET /api/v1/auth/me
 * Get current authenticated user
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.userId;

    if (!userId) {
      throw new ApiError(401, 'Not authenticated');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.json({
      success: true,
      data: user,
    });
  })
);

export default router;
