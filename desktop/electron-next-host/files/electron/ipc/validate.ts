import { isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

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

/**
 * True for the startup page: a file:// URL for a file inside `pagesDir` (the pack's electron/pages
 * folder). IPC from the startup page is how it asks to retry.
 */
export function isStartupUrl(url: string | undefined, pagesDir: string): boolean {
  const parsed = parseUrl(url);
  if (!parsed || parsed.protocol !== 'file:') return false;
  let file: string;
  try {
    file = fileURLToPath(parsed);
  } catch {
    return false;
  }
  const rel = relative(resolve(pagesDir), file);
  return rel !== '' && rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
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
