// Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
import path from 'path';

// Load .env file (in Docker, compose's env_file/environment set the same variables)
const envPath = path.join(process.cwd(), '.env');
dotenv.config({ path: envPath });

// Now import everything else
import prisma from './lib/prisma.js';
import { closeRedis } from './lib/redis.js';
import { createApp } from './app.js';

const app = createApp();
const PORT = process.env.API_PORT || 3001;

// ============================================================================
// SERVER STARTUP
// ============================================================================

const server = app.listen(PORT, () => {
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

// Graceful shutdown (docker stop sends SIGTERM)
async function shutdown() {
  console.log('\n\n🛑 Shutting down gracefully...');
  server.close();
  await Promise.allSettled([prisma.$disconnect(), closeRedis()]);
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default app;
