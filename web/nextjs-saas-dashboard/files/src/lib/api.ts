/**
 * API Client for SaaS Dashboard
 *
 * `apiClient.get("/users/me")` calls /api/backend/users/me on this app's own
 * origin. That server route (src/app/api/backend/[...path]) adds the signed-in
 * user's API token and forwards the call to API_URL, so the browser never
 * holds the token. Requests carry the session cookie automatically.
 */

const API_PATH = "/api/backend";

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

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(`${API_PATH}${endpoint}`, {
      ...options,
      headers,
      credentials: "same-origin",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiClientError(
        errorData.message || `HTTP error! status: ${response.status}`,
        response.status,
        errorData.errors
      );
    }

    if (response.status === 204) {
      return undefined as T;
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

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: "user" | "admin";
}
