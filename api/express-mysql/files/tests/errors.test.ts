import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app, registerUser } from './helpers.js';
import { fakePrisma } from './fakePrisma.js';

const STRONG_SECRET = 'k3Jq9vX2mP7sT4wZ8bN1cR6yH5fL0dGa';
const SECRET_DETAIL = 'connect ECONNREFUSED db-password-hunter2@10.0.0.5:5432';

async function failingUsersList() {
  const { accessToken } = await registerUser();
  vi.spyOn(fakePrisma.user, 'count').mockRejectedValueOnce(new Error(SECRET_DETAIL));
  vi.spyOn(console, 'error').mockImplementation(() => {});
  return request(app).get('/api/v1/users').set('Authorization', `Bearer ${accessToken}`);
}

describe('error responses', () => {
  it('hide internal error messages on 5xx outside development', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('JWT_SECRET', STRONG_SECRET);

    const res = await failingUsersList();

    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('hunter2');
    expect(res.body.error).not.toHaveProperty('stack');
    expect(res.body.error.requestId).toBe(res.headers['x-request-id']);
  });

  it('log the internal detail of a 5xx', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('JWT_SECRET', STRONG_SECRET);

    await failingUsersList();

    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).toContain('hunter2');
  });

  it('keep the internal message in development', async () => {
    vi.stubEnv('NODE_ENV', 'development');

    const res = await failingUsersList();

    expect(res.status).toBe(500);
    expect(res.body.error.message).toBe(SECRET_DETAIL);
  });

  it('turn malformed JSON into a clean 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": "ada@example.com", ');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe('Malformed JSON in request body');
    expect(res.body.error).not.toHaveProperty('stack');
  });

  it('reject a JSON body over 100kb with 413', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ email: 'ada@example.com', password: 'x'.repeat(110 * 1024) }));

    expect(res.status).toBe(413);
    expect(res.body.success).toBe(false);
  });
});
