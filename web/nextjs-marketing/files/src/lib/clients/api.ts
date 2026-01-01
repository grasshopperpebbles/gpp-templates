import { env } from "@/lib/env";
import { fetchJson } from "@/lib/http";

export type LoginRequest = { email: string; password: string };
export type TokenResponse = { access_token: string; refresh_token?: string; token_type: "bearer" };

export const api = {
  async login(payload: LoginRequest) {
    return fetchJson<TokenResponse>(`${env.apiBaseUrl}/api/v1/auth/login`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
