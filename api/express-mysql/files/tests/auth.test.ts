import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { app, registerUser } from './helpers.js';
import { fakePrisma } from './fakePrisma.js';

const refresh = (token: string) => request(app).post('/api/v1/auth/refresh').send({ refresh_token: token });

describe('POST /api/v1/auth/register', () => {
  it('creates a user and returns tokens without the password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'ada@example.com', password: 'correct-horse', name: 'Ada' });

    expect(res.status).toBe(201);
    expect(res.body.data.user).toMatchObject({ email: 'ada@example.com', name: 'Ada', role: 'user' });
    expect(res.body.data.user).not.toHaveProperty('password');
    expect(res.body.data.access_token).toEqual(expect.any(String));
    expect(res.body.data.refresh_token).toEqual(expect.any(String));
  });

  it.each([
    ['an invalid email', { email: 'not-an-email', password: 'correct-horse', name: 'Ada' }],
    ['a short password', { email: 'ada@example.com', password: 'short', name: 'Ada' }],
    ['a missing name', { email: 'ada@example.com', password: 'correct-horse' }],
    ['an email over 191 characters', { email: `${'a'.repeat(60)}@${'b'.repeat(60)}.${'c'.repeat(66)}.com`, password: 'correct-horse', name: 'Ada' }],
    ['a password over 72 characters', { email: 'ada@example.com', password: 'p'.repeat(73), name: 'Ada' }],
    ['a password over 72 UTF-8 bytes', { email: 'ada@example.com', password: 'é'.repeat(37), name: 'Ada' }],
  ])('rejects %s with 400', async (_label, body) => {
    const res = await request(app).post('/api/v1/auth/register').send(body);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('accepts an email of exactly 191 characters', async () => {
    const email = `${'a'.repeat(60)}@${'b'.repeat(60)}.${'c'.repeat(65)}.com`;
    expect(email).toHaveLength(191);

    const res = await request(app).post('/api/v1/auth/register').send({ email, password: 'correct-horse', name: 'Ada' });

    expect(res.status).toBe(201);
  });

  it('accepts a password of exactly 72 bytes', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'ada@example.com', password: 'p'.repeat(72), name: 'Ada' });

    expect(res.status).toBe(201);
  });

  it('stores the email trimmed and lowercased', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: '  Ada@Example.COM ', password: 'correct-horse', name: 'Ada' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('ada@example.com');
  });

  it('ignores a role in the body: registration always creates a normal user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'ada@example.com', password: 'correct-horse', name: 'Ada', role: 'admin' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('user');
    const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${res.body.data.access_token}`);
    expect(me.body.data.role).toBe('user');
  });

  it('rejects a duplicate email with 409', async () => {
    await registerUser();

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'ada@example.com', password: 'another-pass', name: 'Ada 2' });

    expect(res.status).toBe(409);
  });

  it('rejects an email that differs only in case with 409', async () => {
    await registerUser();

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'ADA@example.com', password: 'another-pass', name: 'Ada 2' });

    expect(res.status).toBe(409);
  });

  it('fails with a generic 500 in production when JWT_SECRET is not set', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('JWT_SECRET', '');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'ada@example.com', password: 'correct-horse', name: 'Ada' });

    expect(res.status).toBe(500);
    expect(res.body.error.message).not.toMatch(/JWT/);
    expect(errorSpy).toHaveBeenCalled();
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

  it('matches the email case-insensitively', async () => {
    await registerUser();

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: ' ADA@Example.com', password: 'correct-horse' });

    expect(res.status).toBe(200);
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

  it('still runs a bcrypt comparison for an unknown email (no timing oracle)', async () => {
    const compare = vi.spyOn(bcrypt, 'compare');

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'correct-horse' });

    expect(res.status).toBe(401);
    expect(compare).toHaveBeenCalledTimes(1);
    const [, hash] = compare.mock.calls[0] as unknown as [string, string];
    expect(hash).toMatch(/^\$2[aby]\$10\$/);
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
    expect(res.body.data).toMatchObject({ id: user.id, email: 'ada@example.com', role: 'user' });
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

  it('rejects the access token of a deleted user (401)', async () => {
    const { accessToken, user } = await registerUser();
    const auth = { Authorization: `Bearer ${accessToken}` };
    await request(app).delete(`/api/v1/users/${user.id}`).set(auth).expect(200);

    const res = await request(app).get('/api/v1/auth/me').set(auth);

    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('issues a new access token and a new refresh token', async () => {
    const { refreshToken } = await registerUser();

    const res = await refresh(refreshToken);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ token_type: 'bearer' });
    expect(res.body.data.refresh_token).toEqual(expect.any(String));
    expect(res.body.data.refresh_token).not.toBe(refreshToken);
    const me = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${res.body.data.access_token}`);
    expect(me.status).toBe(200);
  });

  it('the rotated token keeps working: refresh -> refresh -> refresh', async () => {
    let { refreshToken } = await registerUser();

    for (let i = 0; i < 3; i++) {
      const res = await refresh(refreshToken);
      expect(res.status).toBe(200);
      refreshToken = res.body.data.refresh_token;
    }
  });

  it('stores only a hash of the refresh token, linked to its replacement', async () => {
    const { refreshToken } = await registerUser();
    await refresh(refreshToken).expect(200);

    const rows = await fakePrisma.refreshToken.findMany();
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.tokenHash)).not.toContain(refreshToken);
    const [old, current] = rows;
    expect(old.revokedAt).toBeInstanceOf(Date);
    expect(old.replacedById).toBe(current.id);
    expect(current.familyId).toBe(old.familyId);
    expect(current.revokedAt).toBeNull();
  });

  it('rejects a reused (already rotated) token and revokes its whole family', async () => {
    const { refreshToken: first } = await registerUser();
    const rotated = await refresh(first);
    const second = rotated.body.data.refresh_token as string;

    const reuse = await refresh(first);
    expect(reuse.status).toBe(401);
    expect(reuse.body.error.message).toBe('Refresh token has been revoked');

    // The token issued by the legitimate rotation is revoked as well.
    const afterReuse = await refresh(second);
    expect(afterReuse.status).toBe(401);
    const rows = await fakePrisma.refreshToken.findMany();
    expect(rows.every((r) => r.revokedAt !== null)).toBe(true);
  });

  it('reuse revokes only that login, not the user\'s other sessions', async () => {
    const { refreshToken: phone } = await registerUser();
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ada@example.com', password: 'correct-horse' })
      .expect(200);
    const laptop = login.body.data.refresh_token as string;

    await refresh(phone).expect(200);
    await refresh(phone).expect(401); // reuse

    expect((await refresh(laptop)).status).toBe(200);
  });

  it('lets only one of two concurrent refreshes with the same token succeed', async () => {
    const { refreshToken } = await registerUser();

    const statuses = (await Promise.all([refresh(refreshToken), refresh(refreshToken)])).map((r) => r.status);

    expect(statuses.sort()).toEqual([200, 401]);
  });

  it('rejects a validly signed refresh token that the server never issued (401)', async () => {
    const { user } = await registerUser();
    const forged = jwt.sign({ sub: user.id, type: 'refresh', jti: 'x' }, 'test-secret', { expiresIn: '1h' });

    const res = await refresh(forged);

    expect(res.status).toBe(401);
  });

  it('rejects an expired refresh token (401)', async () => {
    const { user } = await registerUser();
    const expired = jwt.sign(
      { sub: user.id, type: 'refresh', exp: Math.floor(Date.now() / 1000) - 10 },
      'test-secret'
    );

    const res = await refresh(expired);

    expect(res.status).toBe(401);
  });

  it('rejects an access token (401)', async () => {
    const { accessToken } = await registerUser();

    const res = await refresh(accessToken);

    expect(res.status).toBe(401);
  });

  it('rejects the refresh token of a deleted user (401)', async () => {
    const { accessToken, refreshToken, user } = await registerUser();
    await request(app).delete(`/api/v1/users/${user.id}`).set('Authorization', `Bearer ${accessToken}`).expect(200);

    const res = await refresh(refreshToken);

    expect(res.status).toBe(401);
    expect(await fakePrisma.refreshToken.findMany()).toHaveLength(0);
  });

  it('requires refresh_token (400)', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').send({});

    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/logout', () => {
  const logout = (token: string) => request(app).post('/api/v1/auth/logout').send({ refresh_token: token });

  it('revokes the refresh token so it cannot be refreshed', async () => {
    const { refreshToken } = await registerUser();

    const res = await logout(refreshToken);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect((await refresh(refreshToken)).status).toBe(401);
  });

  it('is idempotent for an already revoked token', async () => {
    const { refreshToken } = await registerUser();
    await logout(refreshToken).expect(200);

    expect((await logout(refreshToken)).status).toBe(200);
  });

  it('rejects an access token or garbage (401) and requires refresh_token (400)', async () => {
    const { accessToken } = await registerUser();

    expect((await logout(accessToken)).status).toBe(401);
    expect((await logout('not-a-jwt')).status).toBe(401);
    expect((await request(app).post('/api/v1/auth/logout').send({})).status).toBe(400);
  });
});
