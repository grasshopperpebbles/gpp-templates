import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { readDotEnvFile } from './dotenv.js';

export interface HostConfig {
  web: {
    path: string;
    port: number;
    portEnv: string;
    websitePort: number;
    distDir: string;
    readyTimeoutMs: number;
    stopGraceMs: number;
    corsTimeoutMs: number;
  };
  /** services [] = all; waitTimeoutMs bounds `up --wait` (the health checks) */
  compose: { file: string; services: string[]; waitTimeoutMs: number } | null;
  /** url = API base for the CORS preflight (api.port, overridden by api.portEnv); corsOrigin follows the effective web port */
  api: { url: string; corsOrigin: string } | null;
  /** Folder of the root `.env` (the port override is read from it), or null */
  projectRoot: string | null;
}

export class HostConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HostConfigError';
  }
}

const DEFAULT_READY_TIMEOUT_MS = 120_000;
const DEFAULT_STOP_GRACE_MS = 5_000;
const DEFAULT_CORS_TIMEOUT_MS = 5_000;
const DEFAULT_COMPOSE_WAIT_TIMEOUT_MS = 120_000;

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(obj: Json, key: string, where: string): string {
  const value = obj[key];
  if (typeof value !== 'string' || value === '') throw new HostConfigError(`${where}.${key} must be a non-empty string`);
  return value;
}

function port(value: unknown, where: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 65535) {
    throw new HostConfigError(`${where} must be an integer from 1 to 65535`);
  }
  return value;
}

function positiveInt(value: unknown, fallback: number, where: string): number {
  if (value === undefined) return fallback;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new HostConfigError(`${where} must be a positive integer`);
  }
  return value;
}

/**
 * Reads host.config.json. Paths in the file are relative to the file's folder (the desktop
 * workspace) and come back absolute. `web.portEnv` overrides `web.port`: the process env first,
 * then the project root's `.env` (the folder of `projectRoot`, else of the compose file).
 * `api.portEnv` (optional) overrides `api.port` the same way.
 */
export function loadHostConfig(
  file: string,
  env: NodeJS.ProcessEnv,
  readEnvFile: (file: string) => Record<string, string> = readDotEnvFile,
): HostConfig {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    throw new HostConfigError(`Cannot read ${file}: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!isObject(raw)) throw new HostConfigError('host.config.json must be a JSON object');
  const base = dirname(resolve(file));

  const webRaw = raw.web;
  if (!isObject(webRaw)) throw new HostConfigError('host.config.json needs a "web" block');
  const portEnv = str(webRaw, 'portEnv', 'web');
  let webPort = port(webRaw.port, 'web.port');

  let compose: HostConfig['compose'] = null;
  if (raw.compose != null) {
    if (!isObject(raw.compose)) throw new HostConfigError('compose must be an object or null');
    const services = raw.compose.services ?? [];
    if (!Array.isArray(services) || !services.every((s) => typeof s === 'string')) {
      throw new HostConfigError('compose.services must be an array of strings');
    }
    compose = {
      file: resolve(base, str(raw.compose, 'file', 'compose')),
      services: services as string[],
      waitTimeoutMs: positiveInt(raw.compose.waitTimeoutMs, DEFAULT_COMPOSE_WAIT_TIMEOUT_MS, 'compose.waitTimeoutMs'),
    };
  }

  let projectRoot: string | null = null;
  if (raw.projectRoot !== undefined) projectRoot = resolve(base, str(raw, 'projectRoot', 'host.config.json'));
  else if (compose) projectRoot = dirname(compose.file);

  // process env first, then the project root's .env
  const envValue = (name: string): string | undefined => {
    const fromProcess = env[name];
    if (fromProcess !== undefined && fromProcess !== '') return fromProcess;
    const fromFile = projectRoot ? readEnvFile(join(projectRoot, '.env'))[name] : undefined;
    return fromFile !== undefined && fromFile !== '' ? fromFile : undefined;
  };
  const portFromEnv = (name: string, fallback: number): number => {
    const override = envValue(name);
    if (override === undefined) return fallback;
    if (!/^\d+$/.test(override)) throw new HostConfigError(`${name} must be an integer port, got "${override}"`);
    const n = Number(override);
    if (n < 1 || n > 65535) throw new HostConfigError(`${name} must be from 1 to 65535, got "${override}"`);
    return n;
  };
  webPort = portFromEnv(portEnv, webPort);

  let api: HostConfig['api'] = null;
  if (raw.api != null) {
    if (!isObject(raw.api)) throw new HostConfigError('api must be an object or null');
    let apiPort = port(raw.api.port, 'api.port');
    if (raw.api.portEnv !== undefined) apiPort = portFromEnv(str(raw.api, 'portEnv', 'api'), apiPort);
    api = { url: `http://localhost:${apiPort}`, corsOrigin: `http://localhost:${webPort}` };
  }

  return {
    web: {
      path: resolve(base, str(webRaw, 'path', 'web')),
      port: webPort,
      portEnv,
      websitePort: port(webRaw.websitePort, 'web.websitePort'),
      distDir: str(webRaw, 'distDir', 'web'),
      readyTimeoutMs: positiveInt(webRaw.readyTimeoutMs, DEFAULT_READY_TIMEOUT_MS, 'web.readyTimeoutMs'),
      stopGraceMs: positiveInt(webRaw.stopGraceMs, DEFAULT_STOP_GRACE_MS, 'web.stopGraceMs'),
      corsTimeoutMs: positiveInt(webRaw.corsTimeoutMs, DEFAULT_CORS_TIMEOUT_MS, 'web.corsTimeoutMs'),
    },
    compose,
    api,
    projectRoot,
  };
}
