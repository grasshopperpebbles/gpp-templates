/**
 * Server-side helpers for the auth-flows routes (gpp add auth-flows).
 *
 * The API's auth-flows endpoints live under {API base}/auth/... on both gpp API packs.
 * Their answers differ: FastAPI returns `{ message }` or `{ detail }` (a string, or a
 * list of validation errors on 422); Express returns `{ success, data: { message } }`
 * or `{ success: false, error: { message } }`. These helpers turn both into
 * `{ message }` / `{ error }` with a plain string.
 */

/** The API base URL including /api/v1, from the same variables as src/lib/auth-config.ts. */
export function apiBaseUrl(): string {
  return (
    process.env.API_URL ||
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:8000/api/v1"
  ).replace(/\/+$/, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** A readable error message from either pack's error body, or `fallback`. */
export function apiErrorMessage(body: unknown, fallback: string): string {
  if (!isRecord(body)) return fallback;
  // FastAPI: { detail: "..." } or { detail: [{ loc, msg }, ...] }
  const detail = body.detail;
  if (typeof detail === "string" && detail) return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (!isRecord(item) || typeof item.msg !== "string") return null;
        const field = Array.isArray(item.loc) ? item.loc.filter((part) => part !== "body").join(".") : "";
        return field ? `${field}: ${item.msg}` : item.msg;
      })
      .filter((message): message is string => !!message);
    if (messages.length > 0) return messages.join("; ");
  }
  // Express: { success: false, error: { message, details?: { validation: [{ field, message }] } } }
  const error = body.error;
  if (isRecord(error)) {
    const validation = isRecord(error.details) ? error.details.validation : undefined;
    if (Array.isArray(validation)) {
      const messages = validation
        .map((item) => (isRecord(item) && typeof item.message === "string" ? item.message : null))
        .filter((message): message is string => !!message);
      if (messages.length > 0) return messages.join("; ");
    }
    if (typeof error.message === "string" && error.message) return error.message;
  }
  if (typeof error === "string" && error) return error;
  if (typeof body.message === "string" && body.message) return body.message;
  return fallback;
}

/** The success payload: FastAPI's body as is, Express's `data`. */
export function apiData(body: unknown): Record<string, unknown> {
  if (isRecord(body) && body.success === true && isRecord(body.data)) return body.data;
  return isRecord(body) ? body : {};
}

export interface ApiResult {
  ok: boolean;
  status: number;
  data: Record<string, unknown>;
  error: string;
}

/** Call {API base}/auth/{path}; never throws. */
export async function callAuthApi(
  path: string,
  init: { method?: "GET" | "POST"; body?: unknown; authorization?: string | null },
  fallbackError: string
): Promise<ApiResult> {
  try {
    const response = await fetch(`${apiBaseUrl()}/auth/${path}`, {
      method: init.method ?? "POST",
      headers: {
        "Content-Type": "application/json",
        ...(init.authorization ? { Authorization: init.authorization } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
    });
    const body: unknown = await response.json().catch(() => null);
    return {
      ok: response.ok,
      status: response.status,
      data: response.ok ? apiData(body) : {},
      error: response.ok ? "" : apiErrorMessage(body, fallbackError),
    };
  } catch (error) {
    console.error(`auth-flows: calling the API (${path}) failed:`, error);
    return { ok: false, status: 502, data: {}, error: "Could not reach the server. Please try again." };
  }
}

/** Read a JSON body without throwing (an empty object when it is not JSON). */
export async function readJson(request: Request): Promise<Record<string, unknown>> {
  const body: unknown = await request.json().catch(() => null);
  return isRecord(body) ? body : {};
}

export function stringField(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  return typeof value === "string" ? value : "";
}
