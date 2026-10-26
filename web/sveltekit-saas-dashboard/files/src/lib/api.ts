import { browser } from "$app/environment";
import { config } from "$lib/config";

/**
 * Call the backend API at config.apiUrl (VITE_API_URL). Sends the stored token, if any,
 * as a Bearer header.
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = browser ? localStorage.getItem("token") : null;
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(`${config.apiUrl}${path}`, { ...init, headers });
}

/** True when the API's /health endpoint answers 200. */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await apiFetch("/health");
    return response.ok;
  } catch {
    return false;
  }
}
