import { isAbsolute, relative, resolve, sep } from 'node:path';

/**
 * The built renderer is served from app://bundle/ (see electron/main.ts) rather than file://, so
 * its requests carry `Origin: app://bundle` instead of `Origin: null`.
 */
export const APP_SCHEME = 'app';
export const APP_HOST = 'bundle';
export const APP_ORIGIN = `${APP_SCHEME}://${APP_HOST}`;

/** `app.getPath` names the renderer may ask for. Add to this list rather than accepting any name. */
export const ALLOWED_PATH_NAMES = ['documents', 'downloads', 'desktop', 'pictures', 'music', 'videos'] as const;

export type AllowedPathName = (typeof ALLOWED_PATH_NAMES)[number];

export function isAllowedPathName(name: unknown): name is AllowedPathName {
  return typeof name === 'string' && (ALLOWED_PATH_NAMES as readonly string[]).includes(name);
}

function parseUrl(url: string | undefined): URL | null {
  if (!url) return null;
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

/** True for the app's own pages: the Vite dev server in development, app://bundle/ otherwise. */
export function isAppUrl(url: string | undefined, devServerUrl: string | undefined): boolean {
  const parsed = parseUrl(url);
  if (!parsed) return false;
  if (devServerUrl) {
    return parsed.origin === parseUrl(devServerUrl)?.origin;
  }
  // Node's URL gives custom schemes an opaque origin, so compare scheme and host
  return parsed.protocol === `${APP_SCHEME}:` && parsed.host === APP_HOST;
}

/**
 * The file under `rootDir` that an app://bundle/ request maps to (`/` maps to index.html), or
 * null when the URL is for another scheme or host, is malformed, or would escape `rootDir`.
 */
export function resolveAppFile(rootDir: string, url: string): string | null {
  const parsed = parseUrl(url);
  if (!parsed || parsed.protocol !== `${APP_SCHEME}:` || parsed.host !== APP_HOST) return null;
  let pathname: string;
  try {
    pathname = decodeURIComponent(parsed.pathname);
  } catch {
    return null;
  }
  if (pathname.includes('\0')) return null;
  const root = resolve(rootDir);
  const file = resolve(root, `.${pathname.endsWith('/') ? `${pathname}index.html` : pathname}`);
  const rel = relative(root, file);
  if (rel === '' || rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) return null;
  return file;
}

/** The URL to hand to the system browser, or null when it isn't an http(s) link. */
export function externalHttpUrl(url: string): string | null {
  const parsed = parseUrl(url);
  return parsed && (parsed.protocol === 'http:' || parsed.protocol === 'https:') ? parsed.href : null;
}

const FORBIDDEN_KEY_SEGMENTS = new Set(['__proto__', 'prototype', 'constructor']);

/** Settings keys are non-empty dot paths (electron-store syntax), e.g. `theme` or `editor.fontSize`. */
export function isValidSettingsKey(key: unknown): key is string {
  return (
    typeof key === 'string' &&
    /^[A-Za-z0-9_-]+(\.[A-Za-z0-9_-]+)*$/.test(key) &&
    !key.split('.').some((segment) => FORBIDDEN_KEY_SEGMENTS.has(segment))
  );
}
