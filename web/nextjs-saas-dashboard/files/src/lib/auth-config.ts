import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

/** Backend API base URL, used on the server only (sign-in and the /api/backend forwarder). */
export const API_URL = (
  process.env.API_URL ||
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8000/api/v1"
).replace(/\/$/, "");

type ApiUser = { id: string | number; email: string; name?: string | null; role?: string };
type LoginResponse = { access_token?: string; token?: string; user?: ApiUser };

/** The Express API packs wrap responses in `{ success, data }`; FastAPI returns the body as is. */
function unwrap<T>(body: unknown): T {
  if (body && typeof body === "object" && "success" in body && "data" in body) {
    return (body as { data: T }).data;
  }
  return body as T;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Authenticate against your API
          const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            return null;
          }

          const data = unwrap<LoginResponse>(await response.json());
          const accessToken = data.access_token ?? data.token;

          // The API packs' login returns only tokens, so load the user with the new token
          let user = data.user;
          if (!user && accessToken) {
            const me = await fetch(`${API_URL}/auth/me`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!me.ok) {
              return null;
            }
            user = unwrap<ApiUser>(await me.json());
          }
          if (!user?.id) {
            return null;
          }

          // Return user object that will be saved in the JWT
          return {
            id: String(user.id),
            email: user.email,
            name: user.name,
            role: user.role === "admin" ? "admin" : "user",
            // Store the API token for making authenticated API requests
            accessToken,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in - add user data to token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        // The API token stays in the encrypted, HTTP-only session cookie.
        // Only server code (src/lib/forward.ts) reads it.
        token.accessToken = user.accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      // Add token data to session
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as "user" | "admin";
      }
      // Never copy token.accessToken here: the session is readable by every script on the page.
      return session;
    },
  },
};
