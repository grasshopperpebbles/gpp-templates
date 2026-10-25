/**
 * Base URL of the backend API, from VITE_API_BASE_URL in .env (e.g. http://localhost:8000/api/v1).
 * Undefined when unset. Vite inlines it at build time, so set the production URL before `pnpm build`;
 * the build also adds its origin to the Content-Security-Policy connect-src (see config/csp.ts).
 */
export const apiBaseUrl: string | undefined = import.meta.env.VITE_API_BASE_URL?.trim() || undefined;
