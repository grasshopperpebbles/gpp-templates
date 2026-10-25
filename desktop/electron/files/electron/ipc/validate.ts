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

/** True for the app's own pages: the Vite dev server in development, the bundled files otherwise. */
export function isAppUrl(url: string | undefined, devServerUrl: string | undefined): boolean {
  const parsed = parseUrl(url);
  if (!parsed) return false;
  if (devServerUrl) {
    return parsed.origin === parseUrl(devServerUrl)?.origin;
  }
  return parsed.protocol === 'file:';
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
