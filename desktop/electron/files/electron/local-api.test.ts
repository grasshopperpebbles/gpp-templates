import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { onLocalApiExit, planLocalApi, readEnvValue } from './local-api';

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
    });
    expect(plan).toEqual({
      command: '/Electron',
      args: ['/res/api/start.mjs'],
      cwd: '/res/api',
      env: {
        ELECTRON_RUN_AS_NODE: '1',
        DATABASE_URL: 'file:C:/Users/a/AppData/Roaming/App/app.db',
        API_PORT: '3002',
      },
    });
  });
});

describe('onLocalApiExit', () => {
  it('is an error only when a non-zero exit happens before a window exists', () => {
    expect(onLocalApiExit(1, false)).toBe(true);
    expect(onLocalApiExit(0, false)).toBe(false);
    expect(onLocalApiExit(1, true)).toBe(false);
  });
});
