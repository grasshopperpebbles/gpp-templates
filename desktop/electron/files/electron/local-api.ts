import { randomBytes } from 'node:crypto';
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const MIN_INSTALL_SECRET = 32;

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
  /** Required for a packaged app. A per-install secret, at least 32 characters. */
  jwtSecret?: string;
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

  const secret = input.jwtSecret?.trim() ?? '';
  if (secret.length < MIN_INSTALL_SECRET) {
    throw new Error('A packaged local API needs a JWT secret of at least 32 characters');
  }
  const apiRoot = join(input.resourcesPath, 'api');
  return {
    command: input.execPath,
    args: [join(apiRoot, 'start.mjs')],
    cwd: apiRoot,
    env: {
      ELECTRON_RUN_AS_NODE: '1',
      NODE_ENV: 'production',
      JWT_SECRET: secret,
      HOST: '127.0.0.1',
      CORS_ORIGINS: 'app://bundle',
      DATABASE_URL: sqliteFileUrl(join(input.userData, 'app.db')),
      API_PORT: input.apiPort,
    },
  };
}

/** File in userData that holds this install's API signing secret. The renderer cannot read userData. */
export function installJwtSecretPath(userData: string): string {
  return join(userData, 'api-jwt-secret');
}

/** Read the install secret, or create one (mode 0600) the first time the packaged app starts. */
export function readOrCreateJwtSecret(userData: string): string {
  const file = installJwtSecretPath(userData);
  try {
    const existing = readFileSync(file, 'utf8').trim();
    if (existing.length >= MIN_INSTALL_SECRET) return existing;
  } catch {
    // Missing file: create it below.
  }
  const secret = randomBytes(32).toString('hex');
  mkdirSync(userData, { recursive: true });
  writeFileSync(file, `${secret}\n`, { mode: 0o600 });
  chmodSync(file, 0o600);
  return secret;
}

/** True when the API process failed. The window may already be open; the failure is still shown. */
export function onLocalApiExit(code: number | null, _hasWindow: boolean): boolean {
  return code !== null && code !== 0;
}
