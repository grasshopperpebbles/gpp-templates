import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app } from './helpers.js';
import { closeRedis } from '../src/lib/redis.js';

describe('GET /health', () => {
  afterEach(async () => {
    await closeRedis();
  });

  it('returns 200 with redis "disabled" when REDIS_URL is empty', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', redis: 'disabled' });
    expect(typeof res.body.uptime).toBe('number');
  });

  it('stays 200 and reports redis "unavailable" when Redis cannot be reached', async () => {
    vi.stubEnv('REDIS_URL', 'redis://127.0.0.1:1/0');

    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', redis: 'unavailable' });
  });

  it('sets an X-Request-ID header', async () => {
    const res = await request(app).get('/health');

    expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('unknown routes', () => {
  it('return a JSON 404 with the request id', async () => {
    const res = await request(app).get('/nope');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.requestId).toBe(res.headers['x-request-id']);
  });
});
