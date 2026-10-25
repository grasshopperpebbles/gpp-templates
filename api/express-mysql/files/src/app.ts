import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Middleware imports
import { requestIdMiddleware, errorHandler, notFoundHandler } from './middleware/error-handler.middleware.js';
import { requestLogger } from './middleware/request-logger.middleware.js';

// Route imports
import healthRoutes from './routes/health.routes.js';
import v1Routes from './routes/v1/index.js';

/**
 * Build the Express app without listening, so tests can drive it with supertest.
 * src/server.ts loads .env, calls createApp() and starts the HTTP server.
 */
export function createApp(): Express {
  const app: Express = express();

  // ==========================================================================
  // MIDDLEWARE STACK (Applied in Order)
  // ==========================================================================

  // 1. Security headers (Helmet)
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for API (not serving HTML)
    crossOriginEmbedderPolicy: false, // Allow embedding
  }));

  // 2. Request ID generation (for tracking and debugging)
  app.use(requestIdMiddleware);

  // 3. Request logger (performance monitoring)
  app.use(requestLogger);

  // 4. CORS configuration
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : '*';

  app.use(cors({
    origin: process.env.NODE_ENV === 'production'
      ? corsOrigins
      : '*', // Development - allow all origins
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
    credentials: false,
  }));

  // 5. Body parsing with size limits (raise per route if one needs bigger bodies, e.g. uploads)
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // ==========================================================================
  // ROUTE MOUNTING
  // ==========================================================================

  // Health check (no authentication)
  app.use('/health', healthRoutes);

  // API v1 routes
  app.use('/api/v1', v1Routes);

  // ==========================================================================
  // ERROR HANDLING (Must be LAST)
  // ==========================================================================

  // 404 handler - catches all unmatched routes
  app.use(notFoundHandler);

  // Global error handler - catches all errors from routes
  app.use(errorHandler);

  return app;
}

export default createApp;
