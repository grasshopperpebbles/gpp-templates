import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  localApiFailureText,
  localApiTreeKill,
  localApiUsesShell,
  onLocalApiExit,
  planLocalApi,
  readEnvValue,
  readOrCreateJwtSecret,
  rememberApiOutput,
} from './local-api';

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
    // Windows reports 0666 for a file created with mode 0600. The mode is applied where Node honors it.
    if (process.platform !== 'win32') {
      expect(statSync(join(dir, 'api-jwt-secret')).mode & 0o777).toBe(0o600);
    }
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

  it('stays quiet while the app is quitting, including the Windows kill exit code', () => {
    expect(onLocalApiExit(1, true, true)).toBe(false);
    expect(onLocalApiExit(0, false, true)).toBe(false);
    expect(onLocalApiExit(null, true, true)).toBe(false);
  });
});

describe('local API process on Windows', () => {
  it('uses a shell only so an unpackaged Windows app can find pnpm', () => {
    expect(localApiUsesShell('win32', false)).toBe(true);
    expect(localApiUsesShell('win32', true)).toBe(false);
    expect(localApiUsesShell('darwin', false)).toBe(false);
    expect(localApiUsesShell('linux', false)).toBe(false);
  });

  it('kills the Windows dev process tree so pnpm does not keep the port', () => {
    expect(localApiTreeKill('win32', false, 4242)).toEqual({
      command: 'taskkill',
      args: ['/PID', '4242', '/T', '/F'],
    });
    expect(localApiTreeKill('win32', true, 4242)).toBeNull();
    expect(localApiTreeKill('darwin', false, 4242)).toBeNull();
    expect(localApiTreeKill('win32', false, undefined)).toBeNull();
  });

  it('is what the desktop main process uses', () => {
    const main = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'main.ts'), 'utf8');
    expect(main).toContain('localApiUsesShell(process.platform, app.isPackaged)');
    expect(main).toContain('shell: usesShell');
    expect(main).toContain('localApiTreeKill(process.platform, app.isPackaged, child.pid)');
  });
});

describe('local API failure text', () => {
  it('keeps the last lines of the API output', () => {
    const first = rememberApiOutput([], 'prisma migrate failed\n');
    const second = rememberApiOutput(first, 'Error: no such table\r\n\r\n');
    expect(second).toEqual(['prisma migrate failed', 'Error: no such table']);
  });

  it('drops lines past the limit', () => {
    let lines: string[] = [];
    for (let i = 0; i < 25; i++) lines = rememberApiOutput(lines, `line ${i}\n`, 20);
    expect(lines).toHaveLength(20);
    expect(lines[0]).toBe('line 5');
    expect(lines[19]).toBe('line 24');
  });

  it('puts the last lines in the dialog', () => {
    const text = localApiFailureText(1, ['listening', 'EADDRINUSE']);
    expect(text).toContain('The local API exited');
    expect(text).toContain('EADDRINUSE');
    expect(localApiFailureText(null, [])).toBe('The local API exited. This window has no API.');
  });
});
