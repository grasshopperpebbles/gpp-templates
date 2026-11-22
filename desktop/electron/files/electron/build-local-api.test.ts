import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildLocalApi, localApiPath } from '../scripts/build-local-api.mjs';

describe('localApiPath', () => {
  it('is unset when the desktop env has no local API', () => {
    expect(localApiPath('/apps/desktop', 'VITE_API_BASE_URL=http://localhost:3001/api/v1\n')).toBeUndefined();
  });

  it('resolves the API directory from the desktop folder', () => {
    expect(localApiPath('/apps/desktop', 'GPP_LOCAL_API_DIR=../api\n')).toBe('/apps/api');
  });
});

describe('buildLocalApi', () => {
  it('does nothing when the desktop env has no local API', () => {
    const spawned: string[][] = [];
    const code = buildLocalApi({
      desktopDir: '/apps/desktop',
      readFile: () => 'VITE_API_BASE_URL=http://localhost:3001/api/v1\n',
      spawn: (args) => {
        spawned.push(args);
        return { status: 0 };
      },
    });
    expect(code).toBe(0);
    expect(spawned).toEqual([]);
  });

  it('stops the installer when pnpm install or build fails', () => {
    const spawned: string[][] = [];
    const code = buildLocalApi({
      desktopDir: '/apps/desktop',
      readFile: () => 'GPP_LOCAL_API_DIR=../api\n',
      spawn: (args) => {
        spawned.push(args);
        return { status: args[0] === 'install' ? 2 : 0 };
      },
    });
    expect(code).toBe(2);
    expect(spawned).toEqual([['install']]);
  });

  it('treats a missing status as a failure and still runs build after install', () => {
    const spawned: string[][] = [];
    const code = buildLocalApi({
      desktopDir: '/apps/desktop',
      readFile: () => 'GPP_LOCAL_API_DIR=../api\n',
      spawn: (args) => {
        spawned.push(args);
        return { status: args[0] === 'build' ? null : 0 };
      },
    });
    expect(code).toBe(1);
    expect(spawned).toEqual([['install'], ['build']]);
  });
});

describe('package.json dist scripts', () => {
  it('builds the local API before electron-builder', () => {
    const pkg = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    for (const name of ['dist', 'dist:mac', 'dist:win', 'dist:linux']) {
      expect(pkg.scripts[name]?.startsWith('node scripts/build-local-api.mjs && ')).toBe(true);
    }
  });
});
