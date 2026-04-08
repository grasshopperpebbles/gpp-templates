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
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error('JWT_SECRET is not set in environment variables');
      throw new ApiError(500, 'Server configuration error');
    }

    try {
      const decoded = jwt.verify(token, secret) as any;
      req.auth = {
        userId: decoded.userId || decoded.id,
        ...decoded,
      };
      next();
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new ApiError(401, 'Invalid token');
      }
      throw error;
    }
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
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return next(); // Continue without authentication
    }

    try {
      const decoded = jwt.verify(token, secret) as any;
      req.auth = {
        userId: decoded.userId || decoded.id,
        ...decoded,
      };
    } catch {
      // Invalid token, but continue without authentication
    }

    next();
  } catch {
    next(); // Continue without authentication
  }
}
