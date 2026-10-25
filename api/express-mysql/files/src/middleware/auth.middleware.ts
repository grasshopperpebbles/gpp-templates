import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from './error-handler.middleware.js';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        [key: string]: any;
      };
    }
  }
}

const DEV_JWT_SECRET = 'dev-secret-change-in-production';

/**
 * The JWT signing secret. Outside production a missing JWT_SECRET falls back to a
 * dev-only value; in production (NODE_ENV=production) it must be set, so a deploy
 * that forgets it fails loudly instead of signing tokens with a known key.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    console.error('JWT_SECRET is not set in environment variables');
    throw new ApiError(500, 'Server configuration error');
  }
  return DEV_JWT_SECRET;
}

/**
 * JWT Authentication middleware
 * Expects Authorization header: "Bearer <token>"
 */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
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

    req.auth = {
      ...decoded,
      userId: decoded.sub || decoded.userId || decoded.id,
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
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, getJwtSecret()) as any;
      if (typeof decoded === 'object' && decoded.type !== 'refresh') {
        req.auth = {
          ...decoded,
          userId: decoded.sub || decoded.userId || decoded.id,
        };
      }
    } catch {
      // Invalid token, but continue without authentication
    }

    next();
  } catch {
    next(); // Continue without authentication
  }
}
