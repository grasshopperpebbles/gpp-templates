import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { ApiError } from './error-handler.middleware.js';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        /** Loaded from the database on every request, never taken from the token. */
        role: Role;
        [key: string]: any;
      };
    }
  }
}

const DEV_JWT_SECRET = 'dev-secret-change-in-production';
const MIN_PRODUCTION_SECRET_LENGTH = 32;
const KNOWN_PLACEHOLDERS = [
  'change-me-in-production-use-a-long-random-string', // .env.example / env.example.txt
  'your-secret-key-change-in-production', // older env.example.txt
  DEV_JWT_SECRET,
];

/**
 * Why `secret` is not acceptable as JWT_SECRET for `nodeEnv`, or null when it is.
 * Outside production anything goes (a missing secret falls back to a dev-only value).
 * In production the secret must be set, must not be a known placeholder (or contain
 * "change-me"/"changeme") and must be at least 32 characters.
 */
export function jwtSecretProblem(secret: string | undefined, nodeEnv: string | undefined): string | null {
  if (nodeEnv !== 'production') return null;
  if (!secret) return 'JWT_SECRET is not set';
  const lower = secret.toLowerCase();
  if (KNOWN_PLACEHOLDERS.includes(secret) || lower.includes('change-me') || lower.includes('changeme')) {
    return 'JWT_SECRET is a placeholder value';
  }
  if (secret.length < MIN_PRODUCTION_SECRET_LENGTH) {
    return `JWT_SECRET is shorter than ${MIN_PRODUCTION_SECRET_LENGTH} characters`;
  }
  return null;
}

/**
 * Called by src/server.ts before it listens: a production deploy with a missing or
 * placeholder JWT_SECRET exits at startup instead of signing tokens with a known key.
 */
export function assertJwtSecretConfigured(): void {
  const problem = jwtSecretProblem(process.env.JWT_SECRET, process.env.NODE_ENV);
  if (problem) {
    throw new Error(
      `${problem}. With NODE_ENV=production, set JWT_SECRET to a random string of at least ` +
        `${MIN_PRODUCTION_SECRET_LENGTH} characters, e.g. \`openssl rand -hex 32\`.`
    );
  }
}

/**
 * The JWT signing secret. Outside production a missing JWT_SECRET falls back to a
 * dev-only value. In production server.ts already refused to start with a bad secret;
 * this re-checks in case the environment changed (or the app runs without server.ts).
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  const problem = jwtSecretProblem(secret, process.env.NODE_ENV);
  if (problem) {
    console.error(`Server configuration error: ${problem}`);
    throw new ApiError(500, 'Server configuration error');
  }
  return secret || DEV_JWT_SECRET;
}

/**
 * JWT Authentication middleware
 * Expects Authorization header: "Bearer <token>"
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Missing or invalid authorization header');
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const secret = getJwtSecret();

    let decoded: any;
    try {
      decoded = jwt.verify(token, secret);
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new ApiError(401, 'Invalid token');
      }
      throw error;
    }

    // Refresh tokens only work on POST /auth/refresh, never as an access token.
    if (typeof decoded !== 'object' || decoded.type === 'refresh') {
      throw new ApiError(401, 'Invalid token');
    }

    const userId = decoded.sub || decoded.userId || decoded.id;
    // A deleted user's still-unexpired access token must stop working, and the role
    // comes from the database so a promotion or demotion applies immediately.
    const user = typeof userId === 'string'
      ? await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } })
      : null;
    if (!user) {
      throw new ApiError(401, 'Invalid token');
    }

    req.auth = {
      ...decoded,
      userId,
      role: user.role,
    };
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication - attaches user if token is present
 * Does not throw error if token is missing
 */
export async function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, getJwtSecret()) as any;
      const userId = typeof decoded === 'object' ? decoded.sub || decoded.userId || decoded.id : undefined;
      const user = typeof userId === 'string' && decoded.type !== 'refresh'
        ? await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } })
        : null;
      if (user) {
        req.auth = { ...decoded, userId, role: user.role };
      }
    } catch {
      // Invalid token, but continue without authentication
    }

    next();
  } catch {
    next(); // Continue without authentication
  }
}

/**
 * Admin-only routes: use after `authenticate`. Anyone else gets 403.
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.auth?.role !== 'admin') {
    return next(new ApiError(403, 'Admin access required'));
  }
  next();
}
