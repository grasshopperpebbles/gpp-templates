import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error-handler.middleware.js';
import { redisStatus } from '../lib/redis.js';

const router: Router = Router();

/**
 * GET /health
 * Health check endpoint. Always 200 while the app is up; Redis being down shows
 * "redis": "unavailable" but does not fail the check (compose's depends_on handles
 * DB/Redis readiness).
 */
router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    redis: await redisStatus(),
  });
}));

export default router;
