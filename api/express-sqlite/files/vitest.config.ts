import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    // No real database or Redis: tests/setup.ts mocks Prisma and leaves REDIS_URL unset.
    setupFiles: ['tests/setup.ts'],
    // Most tests register users, and every register/login is real bcrypt work.
    testTimeout: 20_000,
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-secret',
      REDIS_URL: '',
    },
  },
});
