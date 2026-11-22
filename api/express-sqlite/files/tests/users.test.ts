import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, registerAdmin, registerUser } from './helpers.js';
import { setUserRole } from '../src/lib/admin.js';

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

  it('gets yourself by id, 400 for a malformed id', async () => {
    const found = await request(app).get(`/api/v1/users/${me.id}`).set(auth);
    const malformed = await request(app).get('/api/v1/users/not a cuid').set(auth);

    expect(found.status).toBe(200);
    expect(found.body.data).toMatchObject({ id: me.id, role: 'user' });
    expect(found.body.data).not.toHaveProperty('password');
    expect(malformed.status).toBe(400);
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

  it('cannot make yourself an admin through PATCH (role is ignored)', async () => {
    const res = await request(app).patch(`/api/v1/users/${me.id}`).set(auth).send({ name: 'Ada', role: 'admin' });

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('user');
    const list = await request(app).get('/api/v1/users').set(auth);
    expect(list.status).toBe(403);
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

describe('admin-only routes as a normal user (403)', () => {
  it('cannot list users', async () => {
    const res = await request(app).get('/api/v1/users').set(auth);

    expect(res.status).toBe(403);
    expect(res.body.error.message).toBe('Admin access required');
  });

  it('cannot create users', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .set(auth)
      .send({ email: 'bob@example.com', name: 'Bob', password: 'long-enough' });

    expect(res.status).toBe(403);
  });

  it('cannot view another user, and gets 403 (not 404) for an unknown id', async () => {
    const bob = await registerUser({ email: 'bob@example.com', name: 'Bob' });

    const other = await request(app).get(`/api/v1/users/${bob.user.id}`).set(auth);
    const missing = await request(app).get('/api/v1/users/cmissing0000000000000000').set(auth);

    expect(other.status).toBe(403);
    expect(other.body).not.toHaveProperty('data');
    expect(missing.status).toBe(403);
  });

  it('loses admin access as soon as the role is removed', async () => {
    const admin = await registerAdmin();
    const adminAuth = { Authorization: `Bearer ${admin.accessToken}` };
    await request(app).get('/api/v1/users').set(adminAuth).expect(200);

    await setUserRole(admin.user.email, 'user');

    expect((await request(app).get('/api/v1/users').set(adminAuth)).status).toBe(403);
  });
});

describe('as an admin', () => {
  let adminAuth: { Authorization: string };
  let admin: { id: string };

  beforeEach(async () => {
    const registered = await registerAdmin();
    adminAuth = { Authorization: `Bearer ${registered.accessToken}` };
    admin = registered.user;
  });

  it('lists users with pagination, oldest first', async () => {
    const res = await request(app).get('/api/v1/users?page=1&limit=10').set(adminAuth);

    expect(res.status).toBe(200);
    expect(res.body.data.map((u: { email: string }) => u.email)).toEqual(['ada@example.com', 'root@example.com']);
    expect(res.body.data[1].role).toBe('admin');
    expect(res.body.data[0]).not.toHaveProperty('password');
    expect(res.body.pagination).toEqual({ page: 1, limit: 10, total: 2, pages: 1 });
  });

  it('rejects an out-of-range limit (400)', async () => {
    const res = await request(app).get('/api/v1/users?limit=500').set(adminAuth);

    expect(res.status).toBe(400);
  });

  it('gets any user by id, 404 for an unknown id', async () => {
    const found = await request(app).get(`/api/v1/users/${me.id}`).set(adminAuth);
    const missing = await request(app).get('/api/v1/users/cmissing0000000000000000').set(adminAuth);

    expect(found.status).toBe(200);
    expect(found.body.data).toMatchObject({ id: me.id, email: 'ada@example.com' });
    expect(missing.status).toBe(404);
  });

  it('creates a user (201, role "user" by default) and validates the body (400)', async () => {
    const created = await request(app)
      .post('/api/v1/users')
      .set(adminAuth)
      .send({ email: 'bob@example.com', name: 'Bob', password: 'long-enough' });
    const invalid = await request(app).post('/api/v1/users').set(adminAuth).send({ email: 'bob@example.com' });
    const badRole = await request(app)
      .post('/api/v1/users')
      .set(adminAuth)
      .send({ email: 'carol@example.com', name: 'Carol', password: 'long-enough', role: 'owner' });

    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({ email: 'bob@example.com', name: 'Bob', role: 'user' });
    expect(created.body.data).not.toHaveProperty('password');
    expect(invalid.status).toBe(400);
    expect(badRole.status).toBe(400);
  });

  it('creates another admin', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .set(adminAuth)
      .send({ email: 'carol@example.com', name: 'Carol', password: 'long-enough', role: 'admin' });

    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe('admin');
  });

  it('rejects creating a user whose email differs only in case (409)', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .set(adminAuth)
      .send({ email: 'ADA@Example.com', name: 'Ada again', password: 'long-enough' });

    expect(res.status).toBe(409);
  });

  it('updates and deletes another user, 404 for an unknown id', async () => {
    const updated = await request(app).patch(`/api/v1/users/${me.id}`).set(adminAuth).send({ name: 'Renamed' });
    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({ name: 'Renamed', role: 'user' });

    const missing = await request(app).delete('/api/v1/users/cmissing0000000000000000').set(adminAuth);
    expect(missing.status).toBe(404);

    const deleted = await request(app).delete(`/api/v1/users/${me.id}`).set(adminAuth);
    expect(deleted.status).toBe(200);
    expect((await request(app).get('/api/v1/auth/me').set(auth)).status).toBe(401);
  });

  it('cannot change roles through PATCH', async () => {
    const res = await request(app).patch(`/api/v1/users/${admin.id}`).set(adminAuth).send({ role: 'user' });

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('admin');
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
