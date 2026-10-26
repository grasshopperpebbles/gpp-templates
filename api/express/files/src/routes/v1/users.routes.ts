import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../../lib/prisma.js';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware.js';
import { validate, validateMultiple } from '../../middleware/validation.middleware.js';
import { asyncHandler } from '../../middleware/error-handler.middleware.js';
import { createUserSchema, updateUserSchema, paginationSchema, idParamSchema } from '../../schemas/index.js';
import { ApiError } from '../../middleware/error-handler.middleware.js';
import { BCRYPT_ROUNDS } from './auth.routes.js';

const router: Router = Router();

/**
 * A user may read, change or delete only their own account; an admin may act on anyone.
 * Runs before any lookup, so a non-admin gets 403 for another id whether or not it exists
 * (ids can't be probed).
 */
function assertSelfOrAdmin(req: Request, id: string, message: string): void {
  if (req.auth?.userId !== id && req.auth?.role !== 'admin') {
    throw new ApiError(403, message);
  }
}

const userFields = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
} as const;

/**
 * GET /api/v1/users
 * List users (with pagination). Admin only.
 */
router.get(
  '/',
  authenticate,
  requireAdmin,
  validate(paginationSchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    // Query params are validated by middleware, safely parse as numbers
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        select: userFields,
      }),
      prisma.user.count(),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  })
);

/**
 * GET /api/v1/users/:id
 * Get user by ID: your own, or anyone's as an admin (403 otherwise)
 */
router.get(
  '/:id',
  authenticate,
  validate(idParamSchema, 'params'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    assertSelfOrAdmin(req, id, 'You can only view your own account');

    const user = await prisma.user.findUnique({
      where: { id },
      select: userFields,
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

/**
 * POST /api/v1/users
 * Create new user ("role" optional, default "user"). Admin only.
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate(createUserSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, name, password, role } = req.body;

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new ApiError(409, 'User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
      },
      select: userFields,
    });

    res.status(201).json({
      success: true,
      data: user,
    });
  })
);

/**
 * PATCH /api/v1/users/:id
 * Update your own user, or anyone as an admin (403 otherwise). The role can't be changed
 * here (updateUserSchema has no role field).
 */
router.patch(
  '/:id',
  authenticate,
  validateMultiple({
    params: idParamSchema,
    body: updateUserSchema,
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    assertSelfOrAdmin(req, id, 'You can only modify your own account');
    const updateData = req.body;

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError(404, 'User not found');
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: user,
    });
  })
);

/**
 * DELETE /api/v1/users/:id
 * Delete your own user, or anyone as an admin (403 otherwise). Their refresh tokens go
 * with them (ON DELETE CASCADE).
 */
router.delete(
  '/:id',
  authenticate,
  validate(idParamSchema, 'params'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    assertSelfOrAdmin(req, id, 'You can only modify your own account');

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  })
);

export default router;
