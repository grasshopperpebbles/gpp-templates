export interface CorsResult {
  ok: boolean;
  message: string;
}

const TIMEOUT_MS = 5_000;

/** Sends the preflight a browser would send and checks the API allows `origin`. */
export async function checkCors(apiUrl: string, origin: string, fetchFn: typeof fetch): Promise<CorsResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetchFn(apiUrl, {
      method: 'OPTIONS',
      headers: { Origin: origin, 'Access-Control-Request-Method': 'GET' },
      signal: controller.signal,
    });
    const allowed = response.headers.get('access-control-allow-origin');
    if (allowed === origin || allowed === '*') return { ok: true, message: `The API at ${apiUrl} allows ${origin}.` };
    return {
      ok: false,
      message: `The API at ${apiUrl} doesn't allow ${origin}. Add it to CORS_ORIGINS in the API's env and restart the API.`,
    };
  } catch {
    return { ok: false, message: `The API at ${apiUrl} isn't answering.` };
  } finally {
    clearTimeout(timer);
  }
}
