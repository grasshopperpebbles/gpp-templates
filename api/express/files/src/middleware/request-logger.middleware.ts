import { Request, Response, NextFunction } from 'express';

const EXCLUDED_PATHS = ['/health', '/favicon.ico'];

/**
 * Request logger middleware - tracks performance and logs requests
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  // Skip logging for excluded paths
  if (EXCLUDED_PATHS.includes(req.path)) {
    return next();
  }

  const startTime = Date.now();

  // Track response finish for timing
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const method = req.method;
    const path = req.path;

    // Performance icons
    let icon = '✓';
    if (duration < 100) icon = '⚡';
    else if (duration < 500) icon = '✓';
    else if (duration < 2000) icon = '•';
    else if (duration < 5000) icon = '⏱️ ';
    else icon = '🐌';

    // Color codes (for terminal)
    const statusColor = statusCode >= 500 ? '\x1b[31m' : statusCode >= 400 ? '\x1b[33m' : '\x1b[32m';
    const resetColor = '\x1b[0m';

    console.log(
      `${icon} ${statusColor}${method.padEnd(6)} ${statusCode}${resetColor} ${duration.toString().padStart(5)}ms ${path}`
    );
  });

  next();
}
