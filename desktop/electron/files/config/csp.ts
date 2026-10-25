/**
 * The production Content-Security-Policy, built by vite.config.ts at build time.
 * Pure (no Vite or DOM imports) so it can be unit tested. Type-checked by tsconfig.node.json.
 */
const BASE_POLICY = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:";

/**
 * Returns the CSP for the built renderer. When `apiBaseUrl` (VITE_API_BASE_URL) is set,
 * its origin is added to `connect-src` so `fetch` can reach the API; otherwise the
 * policy is unchanged and `default-src 'self'` blocks every network call.
 */
export function buildContentSecurityPolicy(apiBaseUrl?: string): string {
  const value = apiBaseUrl?.trim();
  if (!value) return BASE_POLICY;

  let origin: string;
  try {
    origin = new URL(value).origin;
  } catch {
    throw new Error(`VITE_API_BASE_URL is not an absolute URL: ${value}`);
  }
  if (!origin.startsWith('http://') && !origin.startsWith('https://')) {
    throw new Error(`VITE_API_BASE_URL must be an http(s) URL: ${value}`);
  }
  return `${BASE_POLICY}; connect-src 'self' ${origin}`;
}

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * A build-time warning when `apiBaseUrl` is plain http:// to a host other than this machine:
 * the packaged app would send tokens and data unencrypted. The URL is still allowed (e.g. a
 * LAN test server); invalid URLs are left to buildContentSecurityPolicy to reject.
 */
export function insecureApiUrlWarning(apiBaseUrl?: string): string | undefined {
  const value = apiBaseUrl?.trim();
  if (!value) return undefined;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return undefined;
  }
  if (url.protocol !== 'http:' || LOOPBACK_HOSTS.has(url.hostname)) return undefined;
  return (
    `VITE_API_BASE_URL uses plain http to ${url.origin}: the built app will send requests ` +
    '(including auth tokens) unencrypted. Use an https:// API URL for production builds.'
  );
}
