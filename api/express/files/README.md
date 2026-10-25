# Express API

Express API server with TypeScript, Prisma (PostgreSQL), JWT auth, an optional Redis client, a
production Dockerfile and a Vitest + Supertest test suite.

## Features

- ✅ **Express.js** with TypeScript
- ✅ **Prisma ORM** with **PostgreSQL** (`provider = "postgresql"`) and an initial migration
- ✅ **Comprehensive Middleware Stack:**
  - Security headers (Helmet)
  - CORS configuration
  - Request ID tracking
  - Performance logging
  - Zod schema validation
  - Error handling with request IDs
  - JWT authentication (register, login, refresh, `/me`)
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
next to `{{PROJECT_SLUG}}-db` (PostgreSQL 16) and `{{PROJECT_SLUG}}-redis` (Redis 7).

### 2. Environment variables

gpp writes `DATABASE_URL` (and `REDIS_URL`) into this folder's `.env` and copies the other
keys from `env.example.txt` / `.env.example`. Inside the container, URLs must use the **Docker
network** hostnames, not `localhost`; the root compose file sets them for the API service.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL URL. gpp writes a `localhost:5432` URL into `.env` for host tools; the root compose file overrides it for the container with `postgresql://…@{{PROJECT_SLUG}}-db:5432/…` |
| `REDIS_URL` | Redis URL. gpp writes it into `.env` and the root compose file sets `redis://{{PROJECT_SLUG}}-redis:6379/0` for the container. Empty or unset disables Redis |
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

The pack ships an initial migration (`prisma/migrations/*_init`, the `users` table). Commit
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
│   ├── prisma.ts          # Prisma client instance
│   └── redis.ts           # Optional Redis client (REDIS_URL)
├── middleware/
│   ├── auth.middleware.ts           # JWT authentication, getJwtSecret()
│   ├── error-handler.middleware.ts  # Error handling
│   ├── request-logger.middleware.ts # Request logging
│   └── validation.middleware.ts     # Zod validation
├── routes/
│   ├── health.routes.ts   # Health check
│   └── v1/
│       ├── index.ts         # API v1 router
│       ├── auth.routes.ts   # Register, login, refresh, me
│       └── users.routes.ts  # Example user routes
└── schemas/
    └── index.ts           # Zod validation schemas
prisma/
├── schema.prisma
└── migrations/            # Initial migration (commit new ones)
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
POST /api/v1/auth/refresh    # { "refresh_token" } -> new access_token
GET  /api/v1/auth/me         # Authorization: Bearer <access_token>
```

- Emails are trimmed and lowercased (`A@X.com` and `a@x.com` are one account), at most 191
  characters (the MySQL `VARCHAR(191)` unique index).
- Passwords are 8 to 72 characters and at most 72 UTF-8 bytes (bcrypt's input limit).
- Login runs a bcrypt comparison even for an unknown email, so response times do not reveal
  which accounts exist.
- Refresh tokens are only accepted by `/auth/refresh`; using one as a bearer token returns 401.
- `authenticate` loads the user on every request, so a deleted user's access token stops
  working immediately, and `/auth/refresh` rejects a deleted user's refresh token.

**Known limitation:** refresh tokens are stateless JWTs. They are not rotated on use and cannot
be revoked individually before they expire (`REFRESH_TOKEN_EXPIRES_IN`, default 30 days); only
deleting the user or changing `JWT_SECRET` (which logs everyone out) invalidates them. Add a
token table (or a per-user token version) if you need logout-everywhere or rotation.

### Users (Requires Authentication)

```bash
GET    /api/v1/users?page=1&limit=10   # limit 1-100
GET    /api/v1/users/:id               # ids are Prisma cuid() strings
POST   /api/v1/users                   # { "email", "name", "password" }
PATCH  /api/v1/users/:id               # { "name"?, "email"? }; only your own id, else 403
DELETE /api/v1/users/:id               # only your own id, else 403
```

Any authenticated user can list and read users and create new ones; `PATCH`/`DELETE` only
work on the caller's own account (`req.auth.userId === :id`, otherwise 403 before any lookup).
Add your own roles if some users should manage others.

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
`closeRedis()` (called on shutdown). gpp's root compose file runs Redis 7 and passes
`REDIS_URL` to this API.

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
`API_PORT`, plus `REDIS_URL` if you use Redis. Build the image from this folder's `Dockerfile` and run
`npx prisma migrate deploy` (in the container) as a release step.

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
