import { externalHttpUrl, isStartupUrl } from '../ipc/validate.js';

/** True only for http://localhost:<port>/… , the origin the desktop's web server answers on. */
export function isPageUrl(url: string | undefined, port: number): boolean {
  if (!url) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  return parsed.protocol === 'http:' && parsed.hostname === 'localhost' && parsed.port === String(port);
}

/** What to do with a navigation or redirect target: stay in the window, hand to the system browser, or drop. */
export type NavigationAction = 'allow' | 'block' | { external: string };

/**
 * The window stays on the startup page and the hosted app. Any other http(s) URL opens in the
 * system browser; anything else (file://, javascript:, custom schemes) is dropped. Used for
 * will-navigate, will-redirect (server redirects don't emit will-navigate) and new-window requests.
 */
export function navigationAction(url: string, port: number, pagesDir: string): NavigationAction {
  if (isPageUrl(url, port) || isStartupUrl(url, pagesDir)) return 'allow';
  const external = externalHttpUrl(url);
  return external ? { external } : 'block';
}

/** A new-window request never opens a window: http(s) goes to the system browser, the rest is dropped. */
export function windowOpenTarget(url: string): string | null {
  return externalHttpUrl(url);
}
