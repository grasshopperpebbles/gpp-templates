import { afterEach, beforeEach, vi } from 'vitest';
import { fakePrisma, resetDb } from './fakePrisma.js';

// Every test file gets the in-memory Prisma instead of a real database connection.
vi.mock('../src/lib/prisma.js', () => ({ default: fakePrisma }));

beforeEach(() => {
  resetDb();
  // Keep the run readable: request logs and 4xx warnings are expected here.
  // console.error (5xx) stays visible.
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
