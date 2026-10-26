// Tauri auth utilities
// Wraps Rust commands for frontend use and talks to the gpp API's /api/v1/auth endpoints.
//
// Both gpp API packs are supported:
// - FastAPI returns bodies as-is: { access_token, refresh_token, token_type, user? }
//   (login has no `user`), errors as { detail }.
// - Express wraps them: { success, data: { access_token, refresh_token, token_type } },
//   errors as { success: false, error: { message } }. Its refresh tokens rotate: every
//   refresh returns a new refresh_token and the old one stops working.

import { invoke } from '@tauri-apps/api/core';

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}

export interface UserInfo {
  id: string;
  email: string;
  name?: string;
}

/**
 * Store auth tokens securely in system keychain
 */
export async function storeAuthTokens(userId: string, tokens: AuthTokens): Promise<void> {
  await invoke('store_auth_tokens', { userId, tokens });
}

/**
 * Get auth tokens from system keychain
 */
export async function getAuthTokens(userId: string): Promise<AuthTokens | null> {
  return invoke<AuthTokens | null>('get_auth_tokens', { userId });
}

/**
 * Clear auth tokens from system keychain
 */
export async function clearAuthTokens(userId: string): Promise<void> {
  await invoke('clear_auth_tokens', { userId });
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(userId: string): Promise<boolean> {
  return invoke<boolean>('is_authenticated', { userId });
}

/**
 * Store current user info
 */
export async function storeUserInfo(user: UserInfo): Promise<void> {
  await invoke('store_user_info', { user });
}

/**
 * Get current user info
 */
export async function getCurrentUser(): Promise<UserInfo | null> {
  return invoke<UserInfo | null>('get_current_user');
}

type Json = Record<string, unknown>;

async function readJson(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

/** The payload of a response: Express nests it under `data`, FastAPI doesn't. */
function unwrap(body: unknown): Json {
  if (body && typeof body === 'object') {
    const data = (body as Json).data;
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return data as Json;
    }
    return body as Json;
  }
  return {};
}

/** The error text of a failed response from either API pack. */
function errorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') {
    return fallback;
  }
  const { detail, error, message } = body as Json;
  if (typeof detail === 'string') {
    return detail; // FastAPI HTTPException
  }
  const firstIssue = Array.isArray(detail) ? (detail[0] as Json | undefined) : undefined;
  if (typeof firstIssue?.msg === 'string') {
    return firstIssue.msg; // FastAPI validation error
  }
  if (error && typeof error === 'object' && typeof (error as Json).message === 'string') {
    return (error as Json).message as string; // Express error handler
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof message === 'string') {
    return message;
  }
  return fallback;
}

async function postJson(url: string, body: unknown, fallbackError: string): Promise<Json> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await readJson(response);
  if (!response.ok) {
    throw new Error(errorMessage(payload, fallbackError));
  }
  return unwrap(payload);
}

function toUserInfo(raw: unknown): UserInfo {
  const user = (raw ?? {}) as Json;
  if (user.id === undefined || user.id === null || typeof user.email !== 'string') {
    throw new Error('Unexpected user data from the API');
  }
  return {
    id: String(user.id),
    email: user.email,
    name: typeof user.name === 'string' ? user.name : undefined,
  };
}

function toTokens(data: Json, previous?: AuthTokens): AuthTokens {
  if (typeof data.access_token !== 'string') {
    throw new Error('Unexpected token data from the API');
  }
  return {
    access_token: data.access_token,
    // Express rotates refresh tokens, so a returned one always replaces the stored one;
    // FastAPI's refresh returns none, so the current one stays.
    refresh_token: typeof data.refresh_token === 'string' ? data.refresh_token : previous?.refresh_token,
    expires_at: typeof data.expires_at === 'number' ? data.expires_at : undefined,
  };
}

/**
 * Fetch the signed-in user (GET /api/v1/auth/me) with an access token
 */
export async function fetchCurrentUser(apiUrl: string, accessToken: string): Promise<UserInfo> {
  const response = await fetch(`${apiUrl}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const payload = await readJson(response);
  if (!response.ok) {
    throw new Error(errorMessage(payload, 'Could not load the current user'));
  }
  return toUserInfo(unwrap(payload));
}

/** Store the session from a login/register payload; the user comes from /me when it isn't included. */
async function storeSession(apiUrl: string, data: Json): Promise<{ user: UserInfo; tokens: AuthTokens }> {
  const tokens = toTokens(data);
  const user = data.user ? toUserInfo(data.user) : await fetchCurrentUser(apiUrl, tokens.access_token);

  await storeUserInfo(user);
  await storeAuthTokens(user.id, tokens);
  return { user, tokens };
}

/**
 * Logout - revoke the refresh token on the API when it supports that (Express
 * POST /api/v1/auth/logout; FastAPI has no logout endpoint) and clear all local auth data.
 */
export async function logout(apiUrl?: string): Promise<void> {
  const user = await getCurrentUser();
  if (user) {
    const tokens = await getAuthTokens(user.id).catch(() => null);
    if (apiUrl && tokens?.refresh_token) {
      try {
        await fetch(`${apiUrl}/api/v1/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: tokens.refresh_token }),
        });
      } catch {
        // Offline or no logout endpoint: the local session is cleared anyway
      }
    }
    await clearAuthTokens(user.id);
  }
  await invoke('logout');
}

/**
 * Login with API backend
 */
export async function login(
  apiUrl: string,
  email: string,
  password: string
): Promise<{ user: UserInfo; tokens: AuthTokens }> {
  const data = await postJson(`${apiUrl}/api/v1/auth/login`, { email, password }, 'Login failed');
  return storeSession(apiUrl, data);
}

/**
 * Register new user with API backend. The gpp API packs sign the new user in (tokens
 * in the response), which is stored like a login; an API that only sends a
 * verification email returns its message and no user.
 */
export async function register(
  apiUrl: string,
  email: string,
  password: string,
  name?: string
): Promise<{ message: string; user?: UserInfo }> {
  const data = await postJson(
    `${apiUrl}/api/v1/auth/register`,
    { email, password, name },
    'Registration failed'
  );
  if (typeof data.access_token === 'string') {
    const { user } = await storeSession(apiUrl, data);
    return { message: 'Registration successful', user };
  }
  return { message: typeof data.message === 'string' ? data.message : 'Registration successful' };
}

/**
 * Request password reset
 */
export async function forgotPassword(apiUrl: string, email: string): Promise<{ message: string }> {
  const data = await postJson(`${apiUrl}/api/v1/auth/forgot-password`, { email }, 'Request failed');
  return { message: typeof data.message === 'string' ? data.message : 'Request sent' };
}

// One refresh at a time per user: Express treats a second use of the same refresh
// token as reuse and revokes the whole login.
const refreshing = new Map<string, Promise<AuthTokens>>();

/**
 * Exchange the stored refresh token for new tokens (POST /api/v1/auth/refresh) and store them
 */
export function refreshTokens(apiUrl: string, userId: string): Promise<AuthTokens> {
  const pending = refreshing.get(userId);
  if (pending) {
    return pending;
  }
  const run = (async () => {
    const current = await getAuthTokens(userId);
    if (!current?.refresh_token) {
      throw new Error('Not authenticated');
    }
    const data = await postJson(
      `${apiUrl}/api/v1/auth/refresh`,
      { refresh_token: current.refresh_token },
      'Session expired'
    );
    const tokens = toTokens(data, current);
    await storeAuthTokens(userId, tokens);
    return tokens;
  })().finally(() => refreshing.delete(userId));
  refreshing.set(userId, run);
  return run;
}

/**
 * Authenticated fetch: on a 401 it refreshes the tokens once and retries
 */
export async function authFetch(
  apiUrl: string,
  userId: string,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const tokens = await getAuthTokens(userId);
  if (!tokens) {
    throw new Error('Not authenticated');
  }

  const send = (accessToken: string) => {
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${accessToken}`);
    return fetch(`${apiUrl}${path}`, { ...options, headers });
  };

  const response = await send(tokens.access_token);
  if (response.status !== 401 || !tokens.refresh_token) {
    return response;
  }

  let refreshed: AuthTokens;
  try {
    refreshed = await refreshTokens(apiUrl, userId);
  } catch {
    return response;
  }
  return send(refreshed.access_token);
}
