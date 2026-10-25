import request from 'supertest';
import { createApp } from '../src/app.js';

export const app = createApp();

export async function registerUser(
  overrides: Partial<{ email: string; password: string; name: string }> = {}
) {
  const body = { email: 'ada@example.com', password: 'correct-horse', name: 'Ada', ...overrides };
  const res = await request(app).post('/api/v1/auth/register').send(body);
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  return {
    user: res.body.data.user as { id: string; email: string; name: string },
    accessToken: res.body.data.access_token as string,
    refreshToken: res.body.data.refresh_token as string,
  };
}
