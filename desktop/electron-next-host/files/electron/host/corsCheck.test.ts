import { describe, expect, it, vi } from 'vitest';
import { checkCors } from './corsCheck';

const api = 'http://localhost:8000';
const origin = 'http://localhost:3010';

function response(headers: Record<string, string>): Response {
  return { headers: new Headers(headers) } as Response;
}

describe('checkCors', () => {
  it('sends OPTIONS with Origin and Access-Control-Request-Method: GET', async () => {
    const fetchFn = vi.fn().mockResolvedValue(response({ 'access-control-allow-origin': origin }));
    await checkCors(api, origin, fetchFn as unknown as typeof fetch);
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(api);
    expect(init.method).toBe('OPTIONS');
    expect(init.headers).toMatchObject({ Origin: origin, 'Access-Control-Request-Method': 'GET' });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('is ok when access-control-allow-origin equals the origin', async () => {
    const fetchFn = vi.fn().mockResolvedValue(response({ 'access-control-allow-origin': origin }));
    expect((await checkCors(api, origin, fetchFn as unknown as typeof fetch)).ok).toBe(true);
  });

  it('is ok when access-control-allow-origin is *', async () => {
    const fetchFn = vi.fn().mockResolvedValue(response({ 'access-control-allow-origin': '*' }));
    expect((await checkCors(api, origin, fetchFn as unknown as typeof fetch)).ok).toBe(true);
  });

  it('is not ok when the header is missing or names another origin', async () => {
    const expected = `The API at ${api} doesn't allow ${origin}. Add it to CORS_ORIGINS in the API's env and restart the API.`;
    const cases: Array<Record<string, string>> = [{}, { 'access-control-allow-origin': 'http://localhost:3000' }];
    for (const headers of cases) {
      const fetchFn = vi.fn().mockResolvedValue(response(headers));
      expect(await checkCors(api, origin, fetchFn as unknown as typeof fetch)).toEqual({ ok: false, message: expected });
    }
  });

  it("is not ok when the API can't be reached", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    expect(await checkCors(api, origin, fetchFn as unknown as typeof fetch)).toEqual({
      ok: false,
      message: `The API at ${api} isn't answering.`,
    });
  });
});
