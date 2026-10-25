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
