# Go HTTP API

Go REST API on the standard library (`net/http` with Go 1.22+ method/path
routing), a Postgres data layer on pgx v5, structured logging (`slog`),
graceful shutdown, a multi-stage Dockerfile and table-driven `httptest` tests.

## Features

- **Go 1.26**, no web framework
- **Item CRUD** example (`/api/v1/items`) behind an `item.Store` interface
- **Postgres** item store on [pgx v5](https://github.com/jackc/pgx) (`pgxpool`)
  when `DATABASE_URL` is set, with embedded SQL migrations applied on startup;
  in-memory store otherwise
- **Health check** at `/health` (liveness) and **readiness** at `/ready`
  (pings Postgres), each also under `/api/v1/`
- **CORS** (`CORS_ORIGINS`, comma-separated) and request logging middleware
- **Redis** cache (`pkg/cache`) when `REDIS_URL` is set, in-memory otherwise
- **Dockerfile**: `golang:1.26-alpine` build, static binary on `alpine:3.22`,
  non-root (UID 10001), healthcheck via `server -healthcheck` (probes `/health` on the `SERVER_ADDR` port)
- **Tests**: `go test -race ./...` over the HTTP layer, both stores and config;
  the Postgres tests run when `TEST_DATABASE_URL` is set

## Quick Start (GPP: run the API in Docker)

In GPP monorepos **backend processes run in containers**. Source lives here for
editing and Git; execution is via Docker Compose from the **repository root**
(see the root `docker-compose.yml` and `gpp start api`).

```bash
cd /path/to/project-root
docker compose up -d
```

The API runs as the `{{PROJECT_SLUG}}-api` service, built from this folder's
`Dockerfile`, next to `{{PROJECT_SLUG}}-db` (and `{{PROJECT_SLUG}}-redis` when
the project uses Redis). The root compose file owns all of these services; this
folder deliberately has **no** `docker-compose.yml`, since a second
`{{PROJECT_SLUG}}-api` container would collide with the root one.

Verify: `curl http://localhost:8080/health` returns
`{"service":"{{PLATFORM_SLUG}}","status":"ok"}`, and
`curl http://localhost:8080/ready` returns `{"database":"ok","status":"ready"}`.
The log line `using Postgres item store` names the database host and the
migrations applied on that start.

### Running the image on its own

Outside a GPP project (or to debug the image alone):

```bash
make docker-build   # docker build -t {{PLATFORM_SLUG}}:latest .
make docker-run     # port 8080, uses .env when present; no database or Redis,
                    # so leave DATABASE_URL unset there (items in memory)
```

## Environment variables

Read once at startup in `pkg/config/config.go`. In Docker, the root compose file
loads this folder's `.env` and then sets `DATABASE_URL` and `REDIS_URL` with the
Docker network hostnames (`{{PROJECT_SLUG}}-db`, `{{PROJECT_SLUG}}-redis`); in
`.env` gpp writes the `localhost` versions for host tools.

| Variable | Default | Purpose |
| --- | --- | --- |
| `SERVER_ADDR` | `:8080` | Listen address. The image healthcheck follows it; under compose keep `:8080` or change the port mapping and compose healthcheck with it |
| `SERVER_READ_TIMEOUT` / `SERVER_WRITE_TIMEOUT` | `10s` / `30s` | Go durations |
| `LOG_LEVEL` | `info` | `debug`, `info`, `warn`, `error` |
| `LOG_FORMAT` | `json` | `json` or `text` |
| `CORS_ORIGINS` | empty | Comma-separated allowed origins; empty or `*` allows any |
| `DATABASE_URL` | empty | Postgres URL (`postgresql://user:pass@host:5432/db`, any [libpq form](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING) pgx accepts, e.g. `?sslmode=require`). Set: items live in Postgres. Empty: in memory, lost on restart |
| `DATABASE_QUERY_TIMEOUT` | `5s` | Upper bound for each database call (Go duration) |
| `REDIS_URL` | empty | `redis://host:6379/0`. Empty, or Redis unreachable at startup, falls back to the in-memory cache |

### Database (Postgres)

`main.go` picks the item store at startup:

- **`DATABASE_URL` set**: it connects with `pgxpool` (retrying for up to 30 s
  while Postgres starts), applies the embedded migrations, then serves items
  from `item.PostgresStore`. If the database is still unreachable after 30 s,
  or a migration fails, the process exits 1 rather than quietly using memory.
  The pool closes after the HTTP server has drained on shutdown.
- **`DATABASE_URL` empty**: items stay in memory (`item.Service`) and a
  warning is logged. Handy for a quick `go run`; the data is gone on restart.

Under gpp's root compose the URL is
`postgresql://postgres:postgres@{{PROJECT_SLUG}}-db:5432/<db>` (the Postgres
service's hostname); `.env` holds the `localhost` version for host tools.

The HTTP layer depends only on `item.Store`:

```go
type Store interface {
	List(ctx context.Context) ([]Item, error)
	Get(ctx context.Context, id string) (Item, error)
	Create(ctx context.Context, req CreateRequest) (Item, error)
	Update(ctx context.Context, id string, req UpdateRequest) (Item, error)
	Delete(ctx context.Context, id string) error
}
```

Each call gets the request's context, so a client that disconnects cancels
its query, and `PostgresStore` adds `DATABASE_QUERY_TIMEOUT` on top. Handlers
map `item.ErrNotFound` to 404 (an ID that is not a UUID is simply not found),
a timeout to 503 and other store errors to 500, always with a fixed message;
the details go to the log.

**Migrations.** `internal/db/migrations/*.sql` is embedded in the binary and
applied in file-name order on every start. Each file runs once, in its own
transaction, and is recorded in the `schema_migrations` table; a Postgres
advisory lock keeps two instances from migrating at the same time. To change
the schema, add the next file (`0002_add_owner.sql`, ...) and never edit one
that has shipped. There are no down migrations; reach for goose or
golang-migrate if you need them.

**Your own tables.** Add a migration, then a store like
`internal/item/postgres.go` (queries with `pgxpool`, `pgx.ErrNoRows` mapped to
your not-found error), and pass the pool from `openItemStore` in `main.go`.

### Redis

`main.go` calls `cache.Init(cfg.RedisURL, logger)`. With a reachable Redis the
package-level helpers (`cache.Get/Set/Delete/DeletePattern`) use it; otherwise
they use memory and log a warning.

### Health and readiness

- `GET /health` is liveness: 200 whenever the process serves HTTP. It never
  touches the database, so `server -healthcheck` (the image `HEALTHCHECK` and
  gpp's compose healthcheck) does not flap when Postgres blips. Because the
  server only starts listening after the database is connected and migrated,
  the container still turns healthy only once the data layer is up.
- `GET /ready` is readiness: 200 `{"status":"ready","database":"ok"}` when
  Postgres answers a ping within 2 s, 503 `{"status":"unavailable","database":"unavailable"}`
  when it does not, and 200 with `"database":"memory"` for the in-memory
  store. Point a load balancer or Kubernetes `readinessProbe` at it.

## Tests (test-first)

```bash
make test          # go vet ./... && go test -race ./...   (local Go with cgo)
make test-db       # the same plus the Postgres tests, on a throwaway postgres:16-alpine
make test-docker   # make test inside golang:1.26, no local Go needed
```

The Postgres tests skip unless `TEST_DATABASE_URL` is set. `make test-db`
starts a container on port 55432 and removes it afterwards; by hand:

```bash
docker run -d --rm --name pg-test -e POSTGRES_PASSWORD=postgres -p 55432:5432 postgres:16-alpine
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:55432/postgres go test -race ./...
docker stop pg-test
```

Each test works in a schema of its own (created and dropped by
`internal/db/dbtest`), so the tests can run in parallel and against a database
that holds other data.

- `internal/api/server_test.go`: health, item routes (status codes, validation,
  JSON shape), routing 404/405, CORS and preflight, concurrent requests (for
  `-race`), and one round trip over a real `httptest.Server`
- `internal/item/item_test.go`: the store contract (defaults, partial update,
  ordering, not-found, copies, concurrent use), run on the in-memory store
- `internal/item/postgres_test.go`: the same contract on `PostgresStore`, plus
  non-UUID IDs, timeouts, cancelation and a closed pool
- `internal/db/db_test.go`: migrations (idempotent, safe to run concurrently)
  and connect retries that give up with the context
- `pkg/config/config_test.go`: env parsing and defaults

Tests are table-driven and use only the standard library. Write the failing
handler test first, then the code. The HTTP tests use the in-memory store; a
new store proves itself by passing `runStoreContract` against Postgres.

## API

| Method | Path | Success | Errors |
| --- | --- | --- | --- |
| GET | `/health`, `/api/v1/health` | 200 `{"status":"ok","service":"..."}` | |
| GET | `/ready`, `/api/v1/ready` | 200 `{"status":"ready","database":"ok"\|"memory"}` | 503 database unreachable |
| GET | `/api/v1/items` | 200 `{"items":[...],"count":n}` (oldest first) | 500/503 database error |
| POST | `/api/v1/items` | 201 item | 400 missing/blank `name` or bad JSON, 413 body over 1 MiB |
| GET | `/api/v1/items/{id}` | 200 item | 404 |
| PUT | `/api/v1/items/{id}` | 200 item (partial update) | 400 blank `name` or bad JSON, 404 |
| DELETE | `/api/v1/items/{id}` | 204 | 404 |

An item is `{"id","name","description?","status","metadata?","created_at","updated_at"}`;
`status` defaults to `"active"`. Errors are `{"error":"message"}`. A wrong
method on a known path is 405; `OPTIONS` on any path is a 204 CORS preflight.
Any item route can also answer 503 (database timeout) or 500 (other database
error).

## Project structure

```
cmd/server/main.go        # config, cache, store choice (Postgres or memory), graceful shutdown
cmd/server/healthcheck.go # the -healthcheck flag
internal/api/server.go    # routes, middleware (CORS, logging), handlers
internal/item/item.go     # Item, Store interface, ErrNotFound, in-memory Service
internal/item/postgres.go # PostgresStore (pgx v5)
internal/db/db.go         # Connect (pgxpool + retry), Migrate (embedded SQL)
internal/db/migrations/   # 0001_create_items.sql, ...
internal/db/dbtest/       # test helper: a migrated pool in a throwaway schema
pkg/config/config.go      # env configuration
pkg/cache/cache.go        # Redis / in-memory cache
Dockerfile, .dockerignore
Makefile, .air.toml       # make targets; hot reload on the host (optional)
```

## Host-only Go (explicit exception only)

If your team has explicitly opted out of the Docker-only rule: `make run`, or
`make dev` with [air](https://github.com/air-verse/air) for hot reload.
