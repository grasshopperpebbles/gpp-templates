import { describe, expect, it } from 'vitest';
import { spawnSync } from 'child_process';
import path from 'path';
import { jwtSecretProblem } from '../src/middleware/auth.middleware.js';

const STRONG = 'k3Jq9vX2mP7sT4wZ8bN1cR6yH5fL0dGa'; // 32 chars

describe('jwtSecretProblem (production JWT_SECRET check)', () => {
  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['the .env.example placeholder', 'change-me-in-production-use-a-long-random-string'],
    ['the old env.example.txt placeholder', 'your-secret-key-change-in-production'],
    ['anything containing change-me', 'please-change-me-0123456789abcdefghijklmnop'],
    ['anything containing changeme', 'CHANGEME-0123456789abcdefghijklmnopqrstuvwxyz'],
    ['shorter than 32 characters', 'k3Jq9vX2mP7sT4wZ8bN1cR6yH5fL0dG'],
  ])('rejects a %s secret in production', (_label, secret) => {
    expect(jwtSecretProblem(secret, 'production')).toEqual(expect.any(String));
  });

  it('accepts a long random secret in production', () => {
    expect(jwtSecretProblem(STRONG, 'production')).toBeNull();
  });

  it('allows placeholders and a missing secret outside production', () => {
    expect(jwtSecretProblem('change-me-in-production-use-a-long-random-string', 'development')).toBeNull();
    expect(jwtSecretProblem(undefined, 'development')).toBeNull();
    expect(jwtSecretProblem('short', 'test')).toBeNull();
  });
});

describe('server startup', () => {
  it('exits with a clear error in production with a placeholder JWT_SECRET', () => {
    const root = path.resolve(__dirname, '..');
    const result = spawnSync(process.execPath, ['--import', 'tsx', 'src/server.ts'], {
      cwd: root,
      env: {
        PATH: process.env.PATH,
        NODE_ENV: 'production',
        JWT_SECRET: 'change-me-in-production-use-a-long-random-string',
        API_PORT: '0',
        REDIS_URL: '',
        DOTENV_CONFIG_QUIET: 'true',
      },
      encoding: 'utf8',
      timeout: 20000,
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/JWT_SECRET/);
    expect(result.stdout).not.toMatch(/Server Running/);
  }, 30000);
});
