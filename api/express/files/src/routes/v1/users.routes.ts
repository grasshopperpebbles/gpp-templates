import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate, validateMultiple } from '../../middleware/validation.middleware.js';
import { asyncHandler } from '../../middleware/error-handler.middleware.js';
import { createUserSchema, updateUserSchema, paginationSchema, idParamSchema } from '../../schemas/index.js';
import { ApiError } from '../../middleware/error-handler.middleware.js';

const router: Router = Router();

/**
 * GET /api/v1/users
 * List users (with pagination)
 */
router.get(
  '/',
  authenticate,
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
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
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
 * Get user by ID
 */
router.get(
  '/:id',
  authenticate,
  validate(idParamSchema, 'params'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
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

/**
 * POST /api/v1/users
 * Create new user
 */
router.post(
  '/',
  authenticate,
  validate(createUserSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, name, password } = req.body;

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new ApiError(409, 'User with this email already exists');
    }

    // Hash password before saving (bcrypt is already imported in package.json)
    const bcrypt = await import('bcrypt');
    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

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

    res.status(201).json({
      success: true,
      data: user,
    });
  })
);

/**
 * PATCH /api/v1/users/:id
 * Update user
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
 * Delete user
 */
router.delete(
  '/:id',
  authenticate,
  validate(idParamSchema, 'params'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

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
