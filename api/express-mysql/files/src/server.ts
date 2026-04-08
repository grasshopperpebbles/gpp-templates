// Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
import path from 'path';

// Load .env file
const envPath = path.join(process.cwd(), '.env');
dotenv.config({ path: envPath });

// Now import everything else
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import prisma from './lib/prisma.js';

// Middleware imports
import { requestIdMiddleware, errorHandler, notFoundHandler } from './middleware/error-handler.middleware.js';
import { requestLogger } from './middleware/request-logger.middleware.js';

// Route imports
import healthRoutes from './routes/health.routes.js';
import v1Routes from './routes/v1/index.js';

const app: Express = express();
const PORT = process.env.API_PORT || 3001;

// ============================================================================
// MIDDLEWARE STACK (Applied in Order)
// ============================================================================

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

// 5. Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================================
// ROUTE MOUNTING
// ============================================================================

// Health check (no authentication)
app.use('/health', healthRoutes);

// API v1 routes
app.use('/api/v1', v1Routes);

// ============================================================================
// ERROR HANDLING (Must be LAST)
// ============================================================================

// 404 handler - catches all unmatched routes
app.use(notFoundHandler);

// Global error handler - catches all errors from routes
app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

// Start server
app.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 Express API Server Running');
  console.log('');
  console.log(`  API:          http://localhost:${PORT}`);
  console.log(`  Health Check: http://localhost:${PORT}/health`);
  console.log(`  API v1:       http://localhost:${PORT}/api/v1`);
  console.log('');
  console.log('📚 Available Endpoints:');
  console.log('  GET    /health');
  console.log('');
  console.log('  POST   /api/v1/auth/register');
  console.log('  POST   /api/v1/auth/login');
  console.log('  POST   /api/v1/auth/refresh');
  console.log('  GET    /api/v1/auth/me');
  console.log('');
  console.log('  GET    /api/v1/users');
  console.log('  GET    /api/v1/users/:id');
  console.log('  POST   /api/v1/users');
  console.log('  PATCH  /api/v1/users/:id');
  console.log('  DELETE /api/v1/users/:id');
  console.log('');
  console.log('🔐 Authentication:');
  console.log('  1. Register: POST /api/v1/auth/register');
  console.log('  2. Login:    POST /api/v1/auth/login');
  console.log('  3. Use:      Authorization: Bearer <access_token>');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
