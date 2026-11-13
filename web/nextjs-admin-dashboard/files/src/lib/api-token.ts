/**
 * Server-only. The API's access token is short-lived and its refresh token is single-use:
 * presenting a used refresh token again ends that login. Requests that carry the same
 * expired session share one refresh, and a request that arrives shortly after with the
 * old cookie receives the same new pair. This holds within one server process; across
 * several admin servers, the API's reuse grace window (REFRESH_TOKEN_REUSE_GRACE_SECONDS)
 * lets a second server's refresh with the same token succeed too.
 */

export interface ApiTokens {
  accessToken: string;
  refreshToken: string;
}

const REUSE_WINDOW_MS = 60_000;
const pending = new Map<string, Promise<ApiTokens | null>>();
const recent = new Map<string, { tokens: ApiTokens; at: number }>();

/** True when the token's `exp` claim falls within the next `withinSeconds`. */
export function expiresSoon(accessToken: string, withinSeconds = 60): boolean {
  const payload = accessToken.split(".")[1];
  if (!payload) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: number };
    return typeof exp === "number" && exp - withinSeconds <= Date.now() / 1000;
  } catch {
    return false;
  }
}

/** Exchanges a refresh token at `<apiUrl>/auth/refresh`. Null when the API refuses it. */
export function refreshApiTokens(apiUrl: string, refreshToken: string): Promise<ApiTokens | null> {
  const now = Date.now();
  for (const [key, entry] of recent) {
    if (now - entry.at > REUSE_WINDOW_MS) recent.delete(key);
  }
  const done = recent.get(refreshToken);
  if (done) return Promise.resolve(done.tokens);

  let request = pending.get(refreshToken);
  if (!request) {
    request = exchange(apiUrl, refreshToken).finally(() => pending.delete(refreshToken));
    pending.set(refreshToken, request);
  }
  return request;
}

async function exchange(apiUrl: string, refreshToken: string): Promise<ApiTokens | null> {
  try {
    const response = await fetch(`${apiUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { data?: unknown };
    const data = (body && typeof body === "object" && "data" in body ? body.data : body) as {
      access_token?: string;
      refresh_token?: string;
    };
    if (!data?.access_token || !data.refresh_token) return null;
    const tokens = { accessToken: data.access_token, refreshToken: data.refresh_token };
    recent.set(refreshToken, { tokens, at: Date.now() });
    return tokens;
  } catch {
    return null;
  }
}
