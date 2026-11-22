import { join, resolve } from 'node:path';

/** Value of one `KEY=value` line, surrounding quotes removed, or undefined when absent. */
export function readEnvValue(content: string, key: string): string | undefined {
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    if (trimmed.slice(0, eq).trim() !== key) continue;
    return stripQuotes(trimmed.slice(eq + 1).trim());
  }
  return undefined;
}

function stripQuotes(value: string): string {
  if (value.length < 2) return value;
  const quote = value[0];
  if ((quote === '"' || quote === "'") && value.endsWith(quote)) {
    return value.slice(1, -1);
  }
  return value;
}

/** `file:` plus the path. Backslashes become slashes so Prisma accepts a Windows path. */
export function sqliteFileUrl(absPath: string): string {
  return `file:${absPath.replaceAll('\\', '/')}`;
}

/**
 * How to start the local API, or null when the desktop env does not ask for one.
 * Dev runs `pnpm dev` and leaves DATABASE_URL to the API's own env file.
 * A packaged app runs Electron as Node on resources/api/start.mjs.
 */
export function planLocalApi(input: {
  packaged: boolean;
  localApiDir: string | undefined;
  desktopRoot: string;
  resourcesPath: string;
  execPath: string;
  userData: string;
  apiPort: string;
}): {
  command: string;
  args: string[];
  cwd: string;
  env: Record<string, string>;
} | null {
  const localApiDir = input.localApiDir?.trim();
  if (!localApiDir) return null;

  if (!input.packaged) {
    return {
      command: 'pnpm',
      args: ['dev'],
      cwd: resolve(input.desktopRoot, localApiDir),
      env: {},
    };
  }

  const apiRoot = join(input.resourcesPath, 'api');
  return {
    command: input.execPath,
    args: [join(apiRoot, 'start.mjs')],
    cwd: apiRoot,
    env: {
      ELECTRON_RUN_AS_NODE: '1',
      DATABASE_URL: sqliteFileUrl(join(input.userData, 'app.db')),
      API_PORT: input.apiPort,
    },
  };
}

/** True only when the API process failed and no window exists yet. */
export function onLocalApiExit(code: number | null, hasWindow: boolean): boolean {
  return code !== null && code !== 0 && !hasWindow;
}
