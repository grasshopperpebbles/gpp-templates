/**
 * API Client for SaaS Dashboard
 * Handles all API requests with authentication and error handling
 */

// Default to port 8000 (FastAPI). Use 3001 for Express.js.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

export class ApiClientError extends Error {
  status?: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status?: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.errors = errors;
  }
}

async function getAuthToken(): Promise<string | null> {
  // In a real implementation, get token from auth context or storage
  // For now, return null (will be implemented with auth system)
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token");
  }
  return null;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiClientError(
        errorData.message || `HTTP error! status: ${response.status}`,
        response.status,
        errorData.errors
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw new ApiClientError(
      error instanceof Error ? error.message : "Network error occurred"
    );
  }
}

export const apiClient = {
  get: <T>(endpoint: string): Promise<T> => request<T>(endpoint, { method: "GET" }),

  post: <T>(endpoint: string, data?: unknown): Promise<T> =>
    request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: unknown): Promise<T> =>
    request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: unknown): Promise<T> =>
    request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string): Promise<T> =>
    request<T>(endpoint, { method: "DELETE" }),
};

/**
 * Auth Types
 */
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: "user" | "admin";
}

/**
 * Auth API
 * Handles login, register, token refresh, and user data
 */
export const authApi = {
  login: async (email: string, password: string): Promise<AuthTokens> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiClientError(
        error.detail || error.message || "Login failed",
        response.status
      );
    }

    const tokens: AuthTokens = await response.json();

    // Store tokens in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", tokens.access_token);
      localStorage.setItem("refresh_token", tokens.refresh_token);
    }

    return tokens;
  },

  register: async (
    email: string,
    password: string,
    name?: string
  ): Promise<AuthTokens> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiClientError(
        error.detail || error.message || "Registration failed",
        response.status
      );
    }

    const tokens: AuthTokens = await response.json();

    // Store tokens in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", tokens.access_token);
      localStorage.setItem("refresh_token", tokens.refresh_token);
    }

    return tokens;
  },

  logout: (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");
    }
  },

  refreshToken: async (): Promise<AuthTokens | null> => {
    if (typeof window === "undefined") return null;

    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        // Refresh failed, clear tokens
        authApi.logout();
        return null;
      }

      const tokens: AuthTokens = await response.json();
      localStorage.setItem("auth_token", tokens.access_token);
      localStorage.setItem("refresh_token", tokens.refresh_token);

      return tokens;
    } catch {
      authApi.logout();
      return null;
    }
  },

  getMe: async (): Promise<User> => {
    return request<User>("/users/me");
  },

  isAuthenticated: (): boolean => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("auth_token");
  },
};
