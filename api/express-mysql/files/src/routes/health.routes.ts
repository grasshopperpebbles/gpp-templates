import { Router, Request, Response } from 'express';

const router: Router = Router();

/**
 * GET /health
 * Health check endpoint
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
