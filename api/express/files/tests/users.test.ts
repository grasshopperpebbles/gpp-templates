import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, registerUser } from './helpers.js';

let auth: { Authorization: string };
let me: { id: string };

beforeEach(async () => {
  const registered = await registerUser();
  auth = { Authorization: `Bearer ${registered.accessToken}` };
  me = registered.user;
});

describe('/api/v1/users', () => {
  it('requires authentication on every route (401)', async () => {
    const id = me.id;
    const responses = await Promise.all([
      request(app).get('/api/v1/users'),
      request(app).get(`/api/v1/users/${id}`),
      request(app).post('/api/v1/users').send({}),
      request(app).patch(`/api/v1/users/${id}`).send({}),
      request(app).delete(`/api/v1/users/${id}`),
    ]);

    expect(responses.map((r) => r.status)).toEqual([401, 401, 401, 401, 401]);
  });

  it('lists users with pagination', async () => {
    const res = await request(app).get('/api/v1/users?page=1&limit=10').set(auth);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).not.toHaveProperty('password');
    expect(res.body.pagination).toEqual({ page: 1, limit: 10, total: 1, pages: 1 });
  });

  it('rejects an out-of-range limit (400)', async () => {
    const res = await request(app).get('/api/v1/users?limit=500').set(auth);

    expect(res.status).toBe(400);
  });

  it('gets a user by id, 404 for an unknown id, 400 for a malformed id', async () => {
    const found = await request(app).get(`/api/v1/users/${me.id}`).set(auth);
    const missing = await request(app).get('/api/v1/users/cmissing0000000000000000').set(auth);
    const malformed = await request(app).get('/api/v1/users/not a cuid').set(auth);

    expect(found.status).toBe(200);
    expect(found.body.data.id).toBe(me.id);
    expect(missing.status).toBe(404);
    expect(malformed.status).toBe(400);
  });

  it('creates a user (201) and validates the body (400)', async () => {
    const created = await request(app)
      .post('/api/v1/users')
      .set(auth)
      .send({ email: 'bob@example.com', name: 'Bob', password: 'long-enough' });
    const invalid = await request(app).post('/api/v1/users').set(auth).send({ email: 'bob@example.com' });

    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({ email: 'bob@example.com', name: 'Bob' });
    expect(created.body.data).not.toHaveProperty('password');
    expect(invalid.status).toBe(400);
  });

  it('rejects creating a user whose email differs only in case (409)', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .set(auth)
      .send({ email: 'ADA@Example.com', name: 'Ada again', password: 'long-enough' });

    expect(res.status).toBe(409);
  });

  it('updates and deletes yourself', async () => {
    const updated = await request(app).patch(`/api/v1/users/${me.id}`).set(auth).send({ name: 'Ada L.' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.name).toBe('Ada L.');

    const deleted = await request(app).delete(`/api/v1/users/${me.id}`).set(auth);
    expect(deleted.status).toBe(200);

    // The deleted user's access token stops working.
    const after = await request(app).get(`/api/v1/users/${me.id}`).set(auth);
    expect(after.status).toBe(401);
  });

  it('normalizes an updated email (trim + lowercase)', async () => {
    const res = await request(app).patch(`/api/v1/users/${me.id}`).set(auth).send({ email: '  Ada.New@Example.COM ' });

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('ada.new@example.com');
  });

  it('rejects updating your email to another user\'s email in any case (409)', async () => {
    await registerUser({ email: 'bob@example.com', name: 'Bob' });

    const res = await request(app).patch(`/api/v1/users/${me.id}`).set(auth).send({ email: 'BOB@example.com' });

    expect(res.status).toBe(409);
  });
});

describe('ownership: user A acting on user B', () => {
  let bob: { id: string };
  let bobAuth: { Authorization: string };

  beforeEach(async () => {
    const registered = await registerUser({ email: 'bob@example.com', name: 'Bob' });
    bob = registered.user;
    bobAuth = { Authorization: `Bearer ${registered.accessToken}` };
  });

  it('A cannot update B (403) and B is unchanged', async () => {
    const res = await request(app).patch(`/api/v1/users/${bob.id}`).set(auth).send({ name: 'Hacked', email: 'evil@example.com' });

    expect(res.status).toBe(403);
    const check = await request(app).get('/api/v1/auth/me').set(bobAuth);
    expect(check.body.data).toMatchObject({ name: 'Bob', email: 'bob@example.com' });
  });

  it('A cannot delete B (403) and B still works', async () => {
    const res = await request(app).delete(`/api/v1/users/${bob.id}`).set(auth);

    expect(res.status).toBe(403);
    const check = await request(app).get('/api/v1/auth/me').set(bobAuth);
    expect(check.status).toBe(200);
  });

  it('A gets 403 (not 404) for an id that does not exist, so ids cannot be probed', async () => {
    const patch = await request(app).patch('/api/v1/users/cmissing0000000000000000').set(auth).send({ name: 'x' });
    const del = await request(app).delete('/api/v1/users/cmissing0000000000000000').set(auth);

    expect(patch.status).toBe(403);
    expect(del.status).toBe(403);
  });
});
