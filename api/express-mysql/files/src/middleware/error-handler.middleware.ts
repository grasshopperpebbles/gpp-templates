import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

// Extend Express Request to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

/**
 * Custom error class with status code and user-friendly message
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Request ID middleware - attaches unique ID to each request
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  req.requestId = randomUUID();
  res.setHeader('X-Request-ID', req.requestId);
  next();
}

/**
 * Transform Prisma errors into user-friendly messages
 */
function handlePrismaError(error: any): { statusCode: number; message: string; details?: any } {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        const field = error.meta?.target ? (error.meta.target as string[])[0] : 'field';
        return {
          statusCode: 409,
          message: `A record with this ${field} already exists`,
          details: { field, code: error.code }
        };

      case 'P2025':
        // Record not found
        return {
          statusCode: 404,
          message: 'The requested record was not found',
          details: { code: error.code }
        };

      case 'P2003':
        // Foreign key constraint violation
        return {
          statusCode: 400,
          message: 'Invalid reference - the related record does not exist',
          details: { code: error.code }
        };

      case 'P2014':
        // Required relation violation
        return {
          statusCode: 400,
          message: 'The change violates a required relation',
          details: { code: error.code }
        };

      default:
        return {
          statusCode: 500,
          message: 'A database error occurred',
          details: { code: error.code }
        };
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      statusCode: 400,
      message: 'Invalid data provided',
      details: { type: 'validation' }
    };
  }

  return {
    statusCode: 500,
    message: 'An unexpected error occurred',
  };
}

/**
 * Get friendly error message based on status code
 */
function getFriendlyMessage(statusCode: number): string {
  const messages: Record<number, string> = {
    400: 'The request contains invalid data. Please check your input and try again.',
    401: 'Authentication required. Please provide valid credentials.',
    402: 'Insufficient credits. Please purchase more credits to continue.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: 'This resource already exists.',
    422: 'The request cannot be processed. Please check your data.',
    429: 'Too many requests. Please slow down and try again later.',
    500: 'An internal server error occurred. Our team has been notified.',
    502: 'The service is temporarily unavailable. Please try again.',
    503: 'The service is currently under maintenance. Please try again later.',
  };

  return messages[statusCode] || 'An unexpected error occurred';
}

/**
 * Error handler middleware - should be mounted LAST after all routes
 */
export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Default error values
  let statusCode = 500;
  let message = 'An unexpected error occurred';
  let details: any = undefined;

  // Handle ApiError (custom errors)
  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    details = error.details;
  }
  // Handle Prisma errors
  else if (error.name?.includes('Prisma')) {
    const prismaError = handlePrismaError(error);
    statusCode = prismaError.statusCode;
    message = prismaError.message;
    details = prismaError.details;
  }
  // Handle validation errors
  else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message || 'Validation failed';
    details = error.errors || error.details;
  }
  // Handle standard errors with statusCode property
  else if (error.statusCode) {
    statusCode = error.statusCode;
    message = error.message || getFriendlyMessage(statusCode);
  }
  // Handle standard HTTP errors
  else if (error.status) {
    statusCode = error.status;
    message = error.message || getFriendlyMessage(statusCode);
  }
  // Handle generic errors
  else if (error.message) {
    message = error.message;
  }

  // Log error details internally (with full stack trace)
  const errorLog = {
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    statusCode,
    message,
    stack: error.stack,
    // Don't log sensitive data
    headers: {
      'user-agent': req.headers['user-agent'],
    },
  };

  // Log to console (in production, this would go to a logging service)
  if (statusCode >= 500) {
    console.error('❌ Server Error:', errorLog);
  } else if (statusCode >= 400) {
    console.warn('⚠️  Client Error:', errorLog);
  }

  // Build response
  const response: any = {
    success: false,
    error: {
      message,
      statusCode,
      requestId: req.requestId,
    }
  };

  // Include details in development
  if (process.env.NODE_ENV === 'development' && details) {
    response.error.details = details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && error.stack) {
    response.error.stack = error.stack.split('\n').slice(0, 5);
  }

  // Send response
  res.status(statusCode).json(response);
}

/**
 * 404 handler - catches all unmatched routes
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      statusCode: 404,
      requestId: req.requestId,
      suggestion: 'Please check the API documentation for available endpoints',
    }
  });
}

/**
 * Helper to create async route handlers that catch errors
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
