import { PrismaClient } from '@prisma/client';

// Create a single shared PrismaClient instance
// This prevents multiple database connections during development
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export default prisma;
