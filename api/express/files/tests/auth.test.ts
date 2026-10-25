import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app, registerUser } from './helpers.js';

describe('POST /api/v1/auth/register', () => {
  it('creates a user and returns tokens without the password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'ada@example.com', password: 'correct-horse', name: 'Ada' });

    expect(res.status).toBe(201);
    expect(res.body.data.user).toMatchObject({ email: 'ada@example.com', name: 'Ada' });
    expect(res.body.data.user).not.toHaveProperty('password');
    expect(res.body.data.access_token).toEqual(expect.any(String));
    expect(res.body.data.refresh_token).toEqual(expect.any(String));
  });

  it.each([
    ['an invalid email', { email: 'not-an-email', password: 'correct-horse', name: 'Ada' }],
    ['a short password', { email: 'ada@example.com', password: 'short', name: 'Ada' }],
    ['a missing name', { email: 'ada@example.com', password: 'correct-horse' }],
  ])('rejects %s with 400', async (_label, body) => {
    const res = await request(app).post('/api/v1/auth/register').send(body);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects a duplicate email with 409', async () => {
    await registerUser();

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'ada@example.com', password: 'another-pass', name: 'Ada 2' });

    expect(res.status).toBe(409);
  });

  it('fails with 500 in production when JWT_SECRET is not set', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('JWT_SECRET', '');

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'ada@example.com', password: 'correct-horse', name: 'Ada' });

    expect(res.status).toBe(500);
    expect(res.body.error.message).toBe('Server configuration error');
  });
});

describe('POST /api/v1/auth/login', () => {
  it('returns tokens for the right password', async () => {
    await registerUser();

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ada@example.com', password: 'correct-horse' });

    expect(res.status).toBe(200);
    expect(res.body.data.access_token).toEqual(expect.any(String));
  });

  it('rejects a wrong password and an unknown email the same way (401)', async () => {
    await registerUser();

    const wrong = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ada@example.com', password: 'wrong-password' });
    const unknown = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'bob@example.com', password: 'correct-horse' });

    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.error.message).toBe(unknown.body.error.message);
  });

  it('validates the body (400)', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'ada@example.com' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/auth/me', () => {
  it('returns the current user for an access token', async () => {
    const { accessToken, user } = await registerUser();

    const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: user.id, email: 'ada@example.com' });
  });

  it('requires a bearer token (401)', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
  });

  it('rejects a malformed token (401)', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', 'Bearer not-a-jwt');

    expect(res.status).toBe(401);
  });

  it('rejects a refresh token used as an access token (401)', async () => {
    const { refreshToken } = await registerUser();

    const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${refreshToken}`);

    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('issues a new access token for a refresh token', async () => {
    const { refreshToken } = await registerUser();

    const res = await request(app).post('/api/v1/auth/refresh').send({ refresh_token: refreshToken });

    expect(res.status).toBe(200);
    const me = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${res.body.data.access_token}`);
    expect(me.status).toBe(200);
  });

  it('rejects an access token (401)', async () => {
    const { accessToken } = await registerUser();

    const res = await request(app).post('/api/v1/auth/refresh').send({ refresh_token: accessToken });

    expect(res.status).toBe(401);
  });

  it('requires refresh_token (400)', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').send({});

    expect(res.status).toBe(400);
  });
});
