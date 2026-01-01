// Tauri auth utilities
// Wraps Rust commands for frontend use

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

/**
 * Logout - clear all auth data
 */
export async function logout(): Promise<void> {
  const user = await getCurrentUser();
  if (user) {
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
  const response = await fetch(`${apiUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Login failed' }));
    throw new Error(error.message || 'Login failed');
  }

  const data = await response.json();
  const user: UserInfo = {
    id: data.user.id,
    email: data.user.email,
    name: data.user.name,
  };
  const tokens: AuthTokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
  };

  // Store securely
  await storeUserInfo(user);
  await storeAuthTokens(user.id, tokens);

  return { user, tokens };
}

/**
 * Register new user with API backend
 */
export async function register(
  apiUrl: string,
  email: string,
  password: string,
  name?: string
): Promise<{ message: string }> {
  const response = await fetch(`${apiUrl}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Registration failed' }));
    throw new Error(error.message || 'Registration failed');
  }

  return response.json();
}

/**
 * Request password reset
 */
export async function forgotPassword(apiUrl: string, email: string): Promise<{ message: string }> {
  const response = await fetch(`${apiUrl}/api/v1/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

/**
 * Get authenticated fetch with token refresh
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

  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${tokens.access_token}`,
    },
  });

  // TODO: Handle token refresh if 401

  return response;
}
