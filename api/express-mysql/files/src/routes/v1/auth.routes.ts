import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../../lib/prisma.js';
import { validate } from '../../middleware/validation.middleware.js';
import { asyncHandler, ApiError } from '../../middleware/error-handler.middleware.js';
import { loginSchema, registerSchema, refreshTokenSchema } from '../../schemas/index.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router: Router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '1h') as SignOptions['expiresIn'];
const REFRESH_TOKEN_EXPIRES_IN = (process.env.REFRESH_TOKEN_EXPIRES_IN || '30d') as SignOptions['expiresIn'];

/**
 * POST /api/v1/auth/register
 * Register a new user
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
    const hashedPassword = await bcrypt.hash(password, 10);

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
        createdAt: true,
      },
    });

    // Generate tokens
    const accessToken = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    const refreshToken = jwt.sign({ sub: user.id, type: 'refresh' }, JWT_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    });

    res.status(201).json({
      success: true,
      data: {
        user,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'bearer',
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

    if (!user || !user.password) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Generate tokens
    const accessToken = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    const refreshToken = jwt.sign({ sub: user.id, type: 'refresh' }, JWT_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    });

    res.json({
      success: true,
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'bearer',
      },
    });
  })
);

/**
 * POST /api/v1/auth/refresh
 * Refresh access token
 */
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { refresh_token } = req.body;

    try {
      // Verify refresh token
      const payload = jwt.verify(refresh_token, JWT_SECRET) as { sub: string; type: string };

      if (payload.type !== 'refresh') {
        throw new ApiError(401, 'Invalid refresh token');
      }

      // Check if user still exists
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new ApiError(401, 'User not found');
      }

      // Generate new access token
      const accessToken = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });

      res.json({
        success: true,
        data: {
          access_token: accessToken,
          token_type: 'bearer',
        },
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(401, 'Invalid or expired refresh token');
    }
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
    const userId = (req as any).auth?.userId || (req as any).auth?.sub;

    if (!userId) {
      throw new ApiError(401, 'Not authenticated');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
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
