# Express API (SQLite)

Express API server with TypeScript, Prisma SQLite (`file:` URL), JWT auth, an optional Redis
client, a production Dockerfile and a Vitest + Supertest test suite.

## Features

- ✅ **Express.js** with TypeScript
- ✅ **Prisma ORM** with **SQLite** (`provider = "sqlite"`) and an initial migration
- ✅ **Comprehensive Middleware Stack:**
  - Security headers (Helmet)
  - CORS configuration
  - Request ID tracking
  - Performance logging
  - Zod schema validation
  - Error handling with request IDs
  - JWT authentication (register, login, refresh, logout, `/me`)
  - Refresh token rotation with reuse detection (hashed `refresh_tokens` table)
  - User roles (`user` / `admin`) with admin-only user management
- ✅ **Type-safe routes** with TypeScript
- ✅ **Health check endpoint** (`GET /health`, reports Redis status)
- ✅ **Redis** client (`src/lib/redis.ts`), optional via `REDIS_URL`
- ✅ **Dockerfile** (node:22-slim, multi-stage, non-root, production deps only, healthcheck). The desktop recipe does not run it.
- ✅ **Vitest + Supertest** tests (in-memory Prisma fake, no database needed)
- ✅ **Graceful shutdown**

## Database

Development uses a SQLite file:

```
DATABASE_URL="file:./dev.db"
```

Prisma resolves that path next to `prisma/schema.prisma` (`prisma/dev.db`).

A packaged Electron app overrides `DATABASE_URL` with `userData/app.db` (a `file:` URL). Leave
`file:./dev.db` for development; do not copy it into the packaged app.

`npm start` runs `node start.mjs`, which applies migrations (`prisma migrate deploy`) and then
loads `dist/server.js`. Apply migrations alone with `npm run db:deploy`.

## Quick Start

### 1. Install, migrate, and run

```bash
npm install
npx prisma migrate deploy
npm run dev
```

The pack ships one migration, `20261122000000_init` (`users`, `refresh_token_families`, and
`refresh_tokens`). Commit `prisma/migrations/`. To change the schema, edit
`prisma/schema.prisma` and create a new migration:

```bash
npx prisma migrate dev --name add_posts
```

### 2. Environment variables

gpp writes `DATABASE_URL` into this folder's `.env` and copies the other keys from
`env.example.txt` / `.env.example`.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite URL. Development is `file:./dev.db`. A packaged Electron app overrides it with `userData/app.db` |
| `JWT_SECRET` | Secret for signing JWTs. With `NODE_ENV=production` the server **exits at startup** unless it is set, is not a placeholder (the shipped value, or anything containing `change-me`/`changeme`) and is at least 32 characters (`openssl rand -hex 32`); outside production a dev-only fallback is used |
| `JWT_EXPIRES_IN` / `REFRESH_TOKEN_EXPIRES_IN` | Access / refresh token lifetimes (default `1h` / `30d`) |
| `REFRESH_TOKEN_REUSE_GRACE_SECONDS` | How long a just-replaced refresh token still works, so two servers refreshing at once don't end the login (default `30`, `0` turns it off) |
| `NODE_ENV` | `development` (from `env.example.txt`) or `production`. Production restricts CORS to `CORS_ORIGINS`, hides 5xx error messages and enforces the `JWT_SECRET` check |
| `CORS_ORIGINS` | Comma-separated allowed origins (production) |
| `API_PORT` | Server port (default `3001`) |

### 3. Verify

```bash
curl http://localhost:3001/health
```

### 4. Make the first admin

Register normally, then promote the account (see [Roles](#roles)):

```bash
npm run set-role -- you@example.com
```

## Project Structure

```
src/
├── app.ts                 # createApp(): middleware + routes, no listen (used by tests)
├── server.ts              # Loads .env, starts the HTTP server, graceful shutdown
├── lib/
│   ├── admin.ts           # setUserRole() (used by scripts/set-role.ts)
│   ├── prisma.ts          # Prisma client instance
│   ├── redis.ts           # Optional Redis client (REDIS_URL)
│   └── tokens.ts          # Access/refresh token issue, rotation, revocation
├── middleware/
│   ├── auth.middleware.ts           # authenticate, requireAdmin, getJwtSecret()
│   ├── error-handler.middleware.ts  # Error handling
│   ├── request-logger.middleware.ts # Request logging
│   └── validation.middleware.ts     # Zod validation
├── routes/
│   ├── health.routes.ts   # Health check
│   └── v1/
│       ├── index.ts         # API v1 router
│       ├── auth.routes.ts   # Register, login, refresh, logout, me
│       └── users.routes.ts  # User routes (admin / self)
├── schemas/
│   └── index.ts           # Zod validation schemas
└── scripts/
    └── set-role.ts        # Make an account admin (or user) by email
prisma/
├── schema.prisma          # User (with role), RefreshTokenFamily, RefreshToken
└── migrations/            # Shipped migration (commit new ones)
start.mjs                  # migrate deploy, then dist/server.js
tests/                     # Vitest + Supertest (health, auth, users, errors, config)
Dockerfile
```

## API Endpoints

### Health Check

```bash
GET /health
# {"status": "ok", "timestamp": "...", "uptime": 1.23, "redis": "ok" | "unavailable" | "disabled"}
```

Always 200 while the app is up. Redis being down shows `"redis": "unavailable"` but does not
fail the check.

### Auth

```bash
POST /api/v1/auth/register   # { "email", "password" (8+ chars), "name" } -> 201, user + tokens
POST /api/v1/auth/login      # { "email", "password" } -> access_token + refresh_token
POST /api/v1/auth/refresh    # { "refresh_token" } -> new access_token + refresh_token
POST /api/v1/auth/logout     # { "refresh_token" } -> revokes it
GET  /api/v1/auth/me         # Authorization: Bearer <access_token>
```

- Emails are trimmed and lowercased (`A@X.com` and `a@x.com` are one account), at most 191
  characters.
- Passwords are 8 to 72 characters and at most 72 UTF-8 bytes (bcrypt's input limit).
- Login runs a bcrypt comparison even for an unknown email, so response times do not reveal
  which accounts exist.
- Registration always creates a `user`; a `role` in the body is ignored.
- Refresh tokens are only accepted by `/auth/refresh` and `/auth/logout`; using one as a bearer
  token returns 401, and access tokens are rejected by both.
- `authenticate` loads the user (and their role) on every request, so a deleted user's access
  token stops working immediately and a role change applies on the next request.

#### Refresh tokens: rotation and revocation

Refresh tokens are JWTs (`type: "refresh"`, a unique `jti`), and each one is also recorded in
the `refresh_tokens` table: a SHA-256 hash of the token (never the token itself), `user_id`,
`family_id`, `expires_at`, `revoked_at` and `replaced_by_id`. Each family also has a row in
`refresh_token_families` (`user_id`, `revoked_at`). Logic is in `src/lib/tokens.ts`.

- **Login / register** start a new token family (one per sign-in, so one per device).
- **`/auth/refresh`** revokes the presented token and returns a new `access_token` **and**
  `refresh_token` in the same family (the old row's `replaced_by_id` points to the new one).
  Store the new refresh token; the old one is now spent.
- **Reuse detection:** presenting a refresh token that was already rotated or logged out
  returns 401 `Refresh token has been revoked` and revokes **every token in its family**, so
  whoever copied it (and the real client) must log in again. Other sign-ins of the same user
  are not affected. Two simultaneous refreshes with the same token count as reuse too (only
  one can claim it), so clients should serialize refreshes.
- **No race:** a refresh runs in one transaction that locks the family's
  `refresh_token_families` row, and reuse detection marks that row revoked while holding the
  same lock. A refresh that races with a reuse therefore either sees the family already
  revoked (and issues nothing) or finishes first, and then its new token is revoked with the
  rest of the family. A revoked family never gets a working token again.
- **`/auth/logout`** revokes the presented refresh token (200, also for an already revoked
  one). It needs only the refresh token, not an access token. Access tokens are stateless and
  stay valid until they expire (`JWT_EXPIRES_IN`, default 1h), so keep them short-lived.
- A refresh token that is not in the table (for example one issued before this table existed,
  or by another server with the same `JWT_SECRET`) is rejected with 401. Deleting a user
  deletes their refresh tokens and families (`ON DELETE CASCADE`).
- Expired rows of a user (and families left without tokens) are deleted when that user next
  logs in. Revoked rows are kept until they expire so reuse can still be detected. To prune
  everything, run `DELETE FROM refresh_tokens WHERE expires_at < now()` and then
  `DELETE FROM refresh_token_families WHERE id NOT IN (SELECT family_id FROM refresh_tokens)`
  from a scheduled job.

### Users (Requires Authentication)

```bash
GET    /api/v1/users?page=1&limit=10   # admin only; limit 1-100, oldest first
GET    /api/v1/users/:id               # your own id, or any id as an admin
POST   /api/v1/users                   # admin only; { "email", "name", "password", "role"? }
PATCH  /api/v1/users/:id               # { "name"?, "email"? }; your own id, or any id as an admin
DELETE /api/v1/users/:id               # your own id, or any id as an admin
```

A normal user gets 403 for the admin-only routes and for any other user's id, whether or not
that id exists (checked before any lookup, so ids cannot be probed). User responses include
`role`; they never include the password hash.

### Roles

`User.role` is a string, `user` (the default) or `admin`. Prisma 5.22 has no SQLite enums, so the database does not reject other values; the API only writes these two (`roleSchema`):

| Action | `user` | `admin` |
| --- | --- | --- |
| Read / update / delete own account | ✅ | ✅ |
| List users, read another user | 403 | ✅ |
| Create users (`POST /users`, optional `"role"`) | 403 | ✅ |
| Update / delete another user | 403 | ✅ |
| Change a role through the API | ❌ | only `POST /users` sets one (for a new account) |

Nobody can change their own role: `registerSchema` and `updateUserSchema` have no `role` field
and zod strips unknown keys, so a `role` sent to register or `PATCH` is ignored. Protect your
own routes with `authenticate, requireAdmin` (from `src/middleware/auth.middleware.ts`).

**The first admin** is made with the `set-role` script, which promotes an existing account by
email. Register the account through the API first, then:

```bash
npm run set-role -- you@example.com

# Demote again
npm run set-role -- you@example.com user
```

It uses the same `DATABASE_URL` as the API. There is deliberately no env-driven bootstrap
(such as an `ADMIN_EMAIL` that is promoted on startup or on registration): until that address
is registered, anyone could register it and become admin. Once you have one admin, create more
with `POST /api/v1/users` and `"role": "admin"`.

## Middleware

### Error Handling

All errors are automatically caught and formatted. Outside `NODE_ENV=development`, 5xx
responses carry a generic message (the real error and stack are logged with the request id),
and malformed JSON is a 400 (`Malformed JSON in request body`). JSON and form bodies are
limited to 100kb (`src/app.ts`; raise it on a route that needs more):

```json
{
  "success": false,
  "error": {
    "message": "User-friendly error message",
    "statusCode": 400,
    "requestId": "uuid-here"
  }
}
```

### Validation

Use Zod schemas for request validation:

```typescript
import { validate } from '../middleware/validation.middleware.js';
import { createUserSchema } from '../schemas/index.js';

router.post('/users',
  validate(createUserSchema),
  async (req, res) => {
    // req.body is validated and type-safe
  }
);
```

### Request Logging

All requests (except `/health`) are logged with method, status code, response time and path.

## Testing

Tests use Supertest against `createApp()` in-process. `tests/setup.ts` replaces
`src/lib/prisma.ts` with an in-memory fake (`tests/fakePrisma.ts`) and `REDIS_URL` is empty, so no
database or Redis needs to be running.

```bash
npm install
npm test
```

Without a local Node 22, run them in a container:

```bash
docker run --rm -v "$PWD:/src:ro" node:22 sh -c \
  "cp -R /src /w && cd /w && rm -rf node_modules && npm install && npm test"
```

When you add a model or a Prisma method the routes use, extend `tests/fakePrisma.ts`.
Write the test first (`tests/*.test.ts`), see it fail, then implement.

## Docker

The desktop recipe does not run this image. The `Dockerfile` is still here and builds a
production image: node:22-slim, multi-stage (deps + `prisma generate` + `tsc` in a build stage),
only production dependencies in the final stage, the non-root `node` user,
`CMD ["node", "dist/server.js"]` and a `HEALTHCHECK` on `/health` (Node's `fetch`, no curl
needed). The Prisma CLI is a runtime dependency so `prisma migrate deploy` works in the container.
Tests, `.env` files and devDependencies are not in the image (`.dockerignore`).

```bash
docker build -t {{PROJECT_SLUG}}-api .
docker run --rm --env-file .env -p 3001:3001 {{PROJECT_SLUG}}-api
```

Add a `package-lock.json` (run `npm install` once and commit it) and the image uses `npm ci`.

## Redis

`src/lib/redis.ts` exposes `getRedis()` (a shared [node-redis](https://github.com/redis/node-redis)
client created on first use, or `null` when `REDIS_URL` is empty), `redisStatus()` and
`closeRedis()` (called on shutdown). Redis is off unless you set `REDIS_URL`. It is not required.

```typescript
import { getRedis } from '../lib/redis.js';

const redis = getRedis();
if (redis) await redis.set('key', 'value', { EX: 60 });
```

The client reconnects in the background and fails commands fast while Redis is down (no offline
queue), so treat it as a cache, not a source of truth.

## Development

### Scripts

- `npm run dev` - Development server with hot reload (tsx)
- `npm run build` - `prisma generate` + compile TypeScript to `dist/`
- `npm start` - Apply migrations, then run the compiled server (`node start.mjs`)
- `npm test` - Run the Vitest suite once (`npm run test:watch` to watch)
- `npm run type-check` - Type check without building
- `npm run db:deploy` - Apply migrations (`prisma migrate deploy`)
- `npm run db:migrate` - Create a migration (`prisma migrate dev`)
- `npm run set-role -- <email> [admin|user]` - Promote (default) or demote an account

### Adding New Routes

1. Create route file in `src/routes/v1/`
2. Import and mount in `src/routes/v1/index.ts`
3. Add validation schemas in `src/schemas/index.ts`
4. Add tests in `tests/`

```typescript
// src/routes/v1/posts.routes.ts
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { asyncHandler } from '../../middleware/error-handler.middleware.js';

const router = Router();

router.get('/', authenticate, asyncHandler(async (req, res) => {
  // Your route logic
}));

export default router;
```

## Production Deployment

For a packaged Electron app, `start.mjs` applies migrations and then listens, with
`DATABASE_URL` pointing at `userData/app.db`. Set `NODE_ENV=production`, a strong `JWT_SECRET`
(32+ random characters; the server exits at startup otherwise), `CORS_ORIGINS` and `API_PORT`.

The `Dockerfile` is optional and is not what the desktop recipe runs. Its image starts
`node dist/server.js` and does not apply migrations; run `npx prisma migrate deploy` as a
release step if you use that image. Make the first admin with `npm run set-role -- <email>`
(see [Roles](#roles)).

## Troubleshooting

### Database

- `DATABASE_URL` for development is `file:./dev.db` (the file is `prisma/dev.db`)
- Missing tables: run `npx prisma migrate deploy` from this directory
- A packaged app reads `userData/app.db`, not the development file

### Port Already in Use

Change `API_PORT` in `.env` or stop the process using the port.

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Zod Documentation](https://zod.dev/)
- [Vitest Documentation](https://vitest.dev/)
