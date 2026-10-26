import request from 'supertest';
import { createApp } from '../src/app.js';
import { setUserRole } from '../src/lib/admin.js';

export const app = createApp();

export async function registerUser(
  overrides: Partial<{ email: string; password: string; name: string }> = {}
) {
  const body = { email: 'ada@example.com', password: 'correct-horse', name: 'Ada', ...overrides };
  const res = await request(app).post('/api/v1/auth/register').send(body);
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  return {
    user: res.body.data.user as { id: string; email: string; name: string; role: string },
    accessToken: res.body.data.access_token as string,
    refreshToken: res.body.data.refresh_token as string,
  };
}

/** Register an account and promote it the way the set-role script does. */
export async function registerAdmin(
  overrides: Partial<{ email: string; password: string; name: string }> = {}
) {
  const registered = await registerUser({ email: 'root@example.com', name: 'Root', ...overrides });
  await setUserRole(registered.user.email, 'admin');
  return registered;
}
