# Express API (MySQL)

Express API server with TypeScript, Prisma (MySQL), JWT auth, an optional Redis client, a
production Dockerfile and a Vitest + Supertest test suite.

## Features

- ✅ **Express.js** with TypeScript
- ✅ **Prisma ORM** with **MySQL** (`provider = "mysql"`) and an initial migration
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
- ✅ **Dockerfile** (node:22-slim, multi-stage, non-root, production deps only, healthcheck)
- ✅ **Vitest + Supertest** tests (in-memory Prisma fake, no database needed)
- ✅ **Graceful shutdown**

## Quick Start (GPP: run the API in Docker)

**GPP default:** run this API **in Docker** from the monorepo root; do not use `npm install` on
the host to **serve** the API. Edit source here; use containers for runtime. Next.js
(`apps/web`) runs on the host, not in Docker.

### 1. Start services from the monorepo root

```bash
cd /path/to/project-root
docker compose up -d
```

The API runs as the `{{PROJECT_SLUG}}-api` service, built from this folder's `Dockerfile`,
next to the API MySQL service (`<api-folder>-mysql`, MySQL 8.4, host port **3308** so it does not clash with a WordPress MariaDB on **3307**).

### 2. Environment variables

gpp writes `DATABASE_URL` into this folder's `.env` and copies the other
keys from `env.example.txt` / `.env.example`. Inside the container, URLs must use the **Docker
network** hostnames, not `localhost`; the root compose file sets them for the API service.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | MySQL URL. gpp writes a `localhost:3308` URL (database `{{PROJECT_DB_SNAKE}}_api_db`) into `.env` for host tools; the root compose file overrides it for the container with `mysql://…@<api-folder>-mysql:3306/…` |
| `REDIS_URL` | Optional Redis URL. gpp's compose file has no Redis service for MySQL projects, so it is unset (Redis "disabled") unless you add one |
| `JWT_SECRET` | Secret for signing JWTs. With `NODE_ENV=production` the server **exits at startup** unless it is set, is not a placeholder (the shipped value, or anything containing `change-me`/`changeme`) and is at least 32 characters (`openssl rand -hex 32`); outside production a dev-only fallback is used |
| `JWT_EXPIRES_IN` / `REFRESH_TOKEN_EXPIRES_IN` | Access / refresh token lifetimes (default `1h` / `30d`) |
| `NODE_ENV` | `development` (from `env.example.txt`) or `production` (the image default). Production restricts CORS to `CORS_ORIGINS`, hides 5xx error messages and enforces the `JWT_SECRET` check |
| `CORS_ORIGINS` | Comma-separated allowed origins (production) |
| `API_PORT` | Server port (default `3001`) |

> **`NODE_ENV` in compose:** the seeded `.env` sets `NODE_ENV=development`, and compose passes
> `.env` to the container, so it **overrides the image's `NODE_ENV=production` default**. In
> development mode CORS allows `*`, error responses include stack traces and details, and the
> `JWT_SECRET` check is skipped. For a production deployment set `NODE_ENV=production` (and a
> real `JWT_SECRET`) in the environment the container actually gets.

### 3. Apply migrations

Migrations do not run on container start. Apply them explicitly:

```bash
docker compose exec {{PROJECT_SLUG}}-api npx prisma migrate deploy
```

The pack ships three migrations: `*_init` (the `users` table), `*_roles_and_refresh_tokens`
(the `role` column and the `refresh_tokens` table) and `*_refresh_token_families` (the
`refresh_token_families` table). Commit
`prisma/migrations/`. To change the schema, edit `prisma/schema.prisma` and create a new
migration against a database that is reachable from where you run it, e.g. on the host with the
`localhost` `DATABASE_URL` from `.env`:

```bash
npx prisma migrate dev --name add_posts
```

then rebuild the image (`docker compose up -d --build`) and run `migrate deploy` again.

### 4. Verify

```bash
curl http://localhost:3001/health
```

### 5. Make the first admin

Register normally, then promote the account (see [Roles](#roles)):

```bash
docker compose exec {{PROJECT_SLUG}}-api node dist/scripts/set-role.js you@example.com
```

### Host-only exception

If your team has **explicitly** opted out of the Docker-only rule, `npm install`,
`npx prisma migrate deploy` and `npm run dev` work on the host with the `localhost` URLs in
`.env`. That is **not** the GPP default.

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
└── migrations/            # Shipped migrations (commit new ones)
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
fail the check; DB/Redis readiness is docker compose's job (`depends_on: condition: service_healthy`).

### Auth

```bash
POST /api/v1/auth/register   # { "email", "password" (8+ chars), "name" } -> 201, user + tokens
POST /api/v1/auth/login      # { "email", "password" } -> access_token + refresh_token
POST /api/v1/auth/refresh    # { "refresh_token" } -> new access_token + refresh_token
POST /api/v1/auth/logout     # { "refresh_token" } -> revokes it
GET  /api/v1/auth/me         # Authorization: Bearer <access_token>
```

- Emails are trimmed and lowercased (`A@X.com` and `a@x.com` are one account), at most 191
  characters (the MySQL `VARCHAR(191)` unique index).
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

`User.role` is a Prisma enum, `user` (the default) or `admin`:

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
# In Docker (the production image has no tsx, so run the compiled script)
docker compose exec {{PROJECT_SLUG}}-api node dist/scripts/set-role.js you@example.com

# On the host
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

The `Dockerfile` builds a production image: node:22-slim, multi-stage (deps + `prisma generate` +
`tsc` in a build stage), only production dependencies in the final stage, the non-root `node`
user, `CMD ["node", "dist/server.js"]` and a `HEALTHCHECK` on `/health` (Node's `fetch`, no curl
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
`closeRedis()` (called on shutdown). gpp's compose file for MySQL projects has no Redis
service, so Redis is off until you add one (e.g. `redis:7-alpine`) and set `REDIS_URL`.

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
- `npm start` - Run the compiled server (`node dist/server.js`)
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

Set `NODE_ENV=production` (the seeded `.env` says `development`, which overrides the image
default inside compose), `DATABASE_URL`, a strong `JWT_SECRET` (32+ random characters; the
server exits at startup otherwise), `CORS_ORIGINS` and
`API_PORT`. Build the image from this folder's `Dockerfile` and run
`npx prisma migrate deploy` (in the container) as a release step. Make the first admin with
`node dist/scripts/set-role.js <email>` (see [Roles](#roles)).

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL`: inside Docker it must use the compose service name, not `localhost`
- Ensure the database container is healthy: `docker compose ps`
- Missing tables: run `docker compose exec {{PROJECT_SLUG}}-api npx prisma migrate deploy`

### Port Already in Use

Change `API_PORT` in `.env` (and the compose port mapping) or stop the process using the port.

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Zod Documentation](https://zod.dev/)
- [Vitest Documentation](https://vitest.dev/)
