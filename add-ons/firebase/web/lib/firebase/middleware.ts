import { NextResponse, type NextRequest } from "next/server";

/**
 * Firebase Auth Middleware
 *
 * Unlike Supabase, Firebase Admin SDK cannot run in Edge Runtime.
 * This middleware checks for a session cookie that should be set
 * after successful authentication via an API route.
 *
 * Flow:
 * 1. User signs in with Firebase Auth (client-side)
 * 2. Client sends ID token to /api/auth/session (or similar)
 * 3. API route verifies token and sets HttpOnly session cookie
 * 4. This middleware checks for that cookie on protected routes
 *
 * @see https://firebase.google.com/docs/auth/admin/manage-cookies
 */

const SESSION_COOKIE_NAME = "__session";

export interface FirebaseMiddlewareConfig {
  /** Routes that require authentication (supports wildcards) */
  protectedRoutes?: string[];
  /** Routes that should redirect to dashboard if already authenticated */
  authRoutes?: string[];
  /** Where to redirect unauthenticated users */
  loginPath?: string;
  /** Where to redirect authenticated users from auth pages */
  dashboardPath?: string;
}

const defaultConfig: FirebaseMiddlewareConfig = {
  protectedRoutes: ["/dashboard", "/account", "/settings"],
  authRoutes: ["/login", "/register", "/signin", "/signup"],
  loginPath: "/login",
  dashboardPath: "/dashboard",
};

/**
 * Check if a path matches any pattern in the list
 * Supports exact matches and wildcard prefixes (e.g., "/dashboard" matches "/dashboard/settings")
 */
function matchesPath(pathname: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    if (pattern.endsWith("*")) {
      return pathname.startsWith(pattern.slice(0, -1));
    }
    return pathname === pattern || pathname.startsWith(pattern + "/");
  });
}

/**
 * Firebase session middleware
 * Handles route protection based on session cookie presence
 */
export function firebaseMiddleware(
  request: NextRequest,
  config: FirebaseMiddlewareConfig = {}
): NextResponse {
  const mergedConfig = { ...defaultConfig, ...config };
  const { protectedRoutes, authRoutes, loginPath, dashboardPath } =
    mergedConfig;

  const pathname = request.nextUrl.pathname;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  const isAuthenticated = !!sessionCookie?.value;

  // Check if accessing a protected route without authentication
  if (!isAuthenticated && matchesPath(pathname, protectedRoutes || [])) {
    const url = request.nextUrl.clone();
    url.pathname = loginPath || "/login";
    // Preserve the intended destination for redirect after login
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Optionally redirect authenticated users away from auth pages
  if (isAuthenticated && matchesPath(pathname, authRoutes || [])) {
    const url = request.nextUrl.clone();
    url.pathname = dashboardPath || "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

/**
 * Get session cookie name (for use in API routes)
 */
export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}
