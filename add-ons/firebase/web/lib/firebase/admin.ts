import "server-only";
import admin from "firebase-admin";

/**
 * Format private key from environment variable
 * Handles escaped newlines from .env files
 */
function formatPrivateKey(key: string): string {
  return key.replace(/\\n/g, "\n");
}

/**
 * Initialize Firebase Admin SDK
 * Returns existing app if already initialized
 */
function initializeAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin SDK credentials. " +
      "Ensure FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY are set."
    );
  }

  const credential = admin.credential.cert({
    projectId,
    clientEmail,
    privateKey: formatPrivateKey(privateKey),
  });

  return admin.initializeApp({
    credential,
    projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

/**
 * Get Firebase Admin Auth instance
 * Use for server-side authentication operations
 */
export async function getAdminAuth(): Promise<admin.auth.Auth> {
  const app = initializeAdminApp();
  return app.auth();
}

/**
 * Get Firebase Admin Firestore instance
 * Use for server-side database operations
 */
export async function getAdminDb(): Promise<admin.firestore.Firestore> {
  const app = initializeAdminApp();
  return app.firestore();
}

/**
 * Get Firebase Admin Storage instance
 * Use for server-side storage operations
 */
export async function getAdminStorage(): Promise<admin.storage.Storage> {
  const app = initializeAdminApp();
  return app.storage();
}

/**
 * Verify Firebase ID token
 * Use in API routes or middleware to authenticate requests
 */
export async function verifyIdToken(
  idToken: string
): Promise<admin.auth.DecodedIdToken> {
  const auth = await getAdminAuth();
  return auth.verifyIdToken(idToken);
}

/**
 * Session cookie configuration
 */
const SESSION_COOKIE_NAME = "__session";
const SESSION_EXPIRY_DAYS = 5;

/**
 * Create a session cookie from an ID token
 * Use in API routes after client authenticates
 *
 * @example
 * // In /api/auth/session route:
 * const idToken = request.headers.get("Authorization")?.split("Bearer ")[1];
 * const sessionCookie = await createSessionCookie(idToken);
 * return new Response(null, {
 *   headers: { "Set-Cookie": sessionCookie },
 * });
 */
export async function createSessionCookie(
  idToken: string,
  expiresInDays: number = SESSION_EXPIRY_DAYS
): Promise<string> {
  const auth = await getAdminAuth();
  const expiresIn = expiresInDays * 24 * 60 * 60 * 1000; // Convert days to ms

  const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

  // Return the full Set-Cookie header value
  const maxAge = expiresInDays * 24 * 60 * 60; // seconds
  return `${SESSION_COOKIE_NAME}=${sessionCookie}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

/**
 * Verify a session cookie and return the decoded claims
 */
export async function verifySessionCookie(
  sessionCookie: string
): Promise<admin.auth.DecodedIdToken> {
  const auth = await getAdminAuth();
  return auth.verifySessionCookie(sessionCookie, true);
}

/**
 * Revoke all sessions for a user
 * Use when user signs out or changes password
 */
export async function revokeUserSessions(uid: string): Promise<void> {
  const auth = await getAdminAuth();
  return auth.revokeRefreshTokens(uid);
}

/**
 * Get the session cookie name
 * Use when reading/clearing the cookie
 */
export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

/**
 * Create a clear session cookie header
 * Use when signing out
 */
export function clearSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
