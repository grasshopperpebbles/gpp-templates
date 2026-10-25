/**
 * Express rate limiting middleware with Redis (production) or in-memory fallback.
 *
 * Usage:
 *   import { rateLimiter } from '@/middleware/rateLimit';
 *   router.get('/api/v1/items', rateLimiter, handler);
 */
import type { NextFunction, Request, Response } from 'express';
import { createClient, type RedisClientType } from 'redis';

const REQUESTS = Number(process.env.RATE_LIMIT_REQUESTS || 100);
const WINDOW_SECONDS = Number(process.env.RATE_LIMIT_WINDOW || 60);
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379/0';

interface WindowEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, WindowEntry>();
let redisClient: RedisClientType | null = null;

function clientIdentifier(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() || 'anonymous';
  }
  return req.ip || 'anonymous';
}

async function getRedisClient(): Promise<RedisClientType | null> {
  if (redisClient) {
    return redisClient;
  }
  try {
    const client = createClient({ url: REDIS_URL });
    client.on('error', () => undefined);
    await client.connect();
    redisClient = client;
    return client;
  } catch {
    return null;
  }
}

async function checkLimit(identifier: string): Promise<{
  limit: number;
  remaining: number;
  resetAt: number;
}> {
  const now = Math.floor(Date.now() / 1000);
  const resetAt = now + WINDOW_SECONDS;
  const redis = await getRedisClient();
  const key = `rate:${identifier}`;

  if (redis) {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, WINDOW_SECONDS);
    }
    const ttl = await redis.ttl(key);
    const effectiveReset = ttl > 0 ? now + ttl : resetAt;
    return {
      limit: REQUESTS,
      remaining: Math.max(0, REQUESTS - count),
      resetAt: effectiveReset,
    };
  }

  const entry = memoryStore.get(key);
  if (!entry || entry.resetAt <= now) {
    memoryStore.set(key, { count: 1, resetAt });
    return { limit: REQUESTS, remaining: REQUESTS - 1, resetAt };
  }

  entry.count += 1;
  memoryStore.set(key, entry);
  return {
    limit: REQUESTS,
    remaining: Math.max(0, REQUESTS - entry.count),
    resetAt: entry.resetAt,
  };
}

export async function rateLimiter(req: Request, res: Response, next: NextFunction) {
  try {
    const identifier = clientIdentifier(req);
    const result = await checkLimit(identifier);

    res.setHeader('X-RateLimit-Limit', String(result.limit));
    res.setHeader('X-RateLimit-Remaining', String(result.remaining));
    res.setHeader('X-RateLimit-Reset', String(result.resetAt));

    if (result.remaining <= 0) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many requests. Maximum ${REQUESTS} requests per ${WINDOW_SECONDS} seconds.`,
        retry_after: Math.max(0, result.resetAt - Math.floor(Date.now() / 1000)),
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}
