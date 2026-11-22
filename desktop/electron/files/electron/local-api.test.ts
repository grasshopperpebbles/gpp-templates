import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { onLocalApiExit, planLocalApi, readEnvValue, readOrCreateJwtSecret } from './local-api';

const SECRET = 'a'.repeat(64);

describe('readEnvValue', () => {
  it('reads an unquoted value', () => {
    expect(readEnvValue('GPP_LOCAL_API_DIR=../api\n', 'GPP_LOCAL_API_DIR')).toBe('../api');
  });

  it('strips surrounding quotes', () => {
    expect(readEnvValue('GPP_LOCAL_API_DIR="../api"\n', 'GPP_LOCAL_API_DIR')).toBe('../api');
  });

  it('returns undefined when the key is missing', () => {
    expect(readEnvValue('X=1\n', 'GPP_LOCAL_API_DIR')).toBeUndefined();
  });
});

describe('planLocalApi', () => {
  it('returns null when the API directory is unset or blank', () => {
    const input = {
      packaged: false,
      desktopRoot: '/proj/apps/desk',
      resourcesPath: '/res',
      execPath: '/Electron',
      userData: '/tmp/user',
      apiPort: '3001',
    };
    expect(planLocalApi({ ...input, localApiDir: undefined })).toBeNull();
    expect(planLocalApi({ ...input, localApiDir: '  ' })).toBeNull();
  });

  it('plans pnpm dev in the resolved API directory', () => {
    const plan = planLocalApi({
      packaged: false,
      localApiDir: '../api',
      desktopRoot: '/proj/apps/desk',
      resourcesPath: '/res',
      execPath: '/Electron',
      userData: '/tmp/user',
      apiPort: '3001',
    });
    expect(plan?.command).toBe('pnpm');
    expect(plan?.args).toEqual(['dev']);
    expect(plan?.cwd).toBe(resolve('/proj/apps/desk', '../api'));
    expect(plan?.env).toEqual({});
  });

  it('plans Electron as Node for a packaged app', () => {
    const plan = planLocalApi({
      packaged: true,
      localApiDir: '../api',
      desktopRoot: '/proj/apps/desk',
      resourcesPath: '/res',
      execPath: '/Electron',
      userData: 'C:\\Users\\a\\AppData\\Roaming\\App',
      apiPort: '3002',
      jwtSecret: SECRET,
    });
    expect(plan).toEqual({
      command: '/Electron',
      args: ['/res/api/start.mjs'],
      cwd: '/res/api',
      env: {
        ELECTRON_RUN_AS_NODE: '1',
        NODE_ENV: 'production',
        JWT_SECRET: SECRET,
        HOST: '127.0.0.1',
        CORS_ORIGINS: 'app://bundle',
        DATABASE_URL: 'file:C:/Users/a/AppData/Roaming/App/app.db',
        API_PORT: '3002',
      },
    });
  });

  it('refuses a packaged plan without a long secret', () => {
    expect(() =>
      planLocalApi({
        packaged: true,
        localApiDir: '../api',
        desktopRoot: '/proj/apps/desk',
        resourcesPath: '/res',
        execPath: '/Electron',
        userData: '/tmp/user',
        apiPort: '3001',
        jwtSecret: 'short',
      }),
    ).toThrow(/32 characters/);
  });
});

describe('readOrCreateJwtSecret', () => {
  let dir = '';
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('creates a 0600 secret and reads it back', () => {
    dir = mkdtempSync(join(tmpdir(), 'gpp-jwt-'));
    const first = readOrCreateJwtSecret(dir);
    expect(first.length).toBeGreaterThanOrEqual(32);
    expect(readOrCreateJwtSecret(dir)).toBe(first);
    expect(statSync(join(dir, 'api-jwt-secret')).mode & 0o777).toBe(0o600);
    expect(readFileSync(join(dir, 'api-jwt-secret'), 'utf8').trim()).toBe(first);
  });
});

describe('onLocalApiExit', () => {
  it('is an error on any non-zero exit, including after the window is open', () => {
    expect(onLocalApiExit(1, false)).toBe(true);
    expect(onLocalApiExit(0, false)).toBe(false);
    expect(onLocalApiExit(1, true)).toBe(true);
    expect(onLocalApiExit(null, false)).toBe(false);
  });
});
