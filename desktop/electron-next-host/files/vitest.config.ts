import { defineConfig } from 'vitest/config';

// Only the pack's own tests. gpp scaffolds logs/log_archive.test.mjs (a node:test file) into every
// project; without this include, vitest picks it up and fails with "No test suite found".
export default defineConfig({
  test: {
    include: ['electron/**/*.test.ts'],
  },
});
