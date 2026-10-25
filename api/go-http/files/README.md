# Go HTTP API

Go REST API on the standard library (`net/http` with Go 1.22+ method/path
routing), structured logging (`slog`), graceful shutdown, a multi-stage
Dockerfile and table-driven `httptest` tests.

## Features

- **Go 1.26**, no web framework
- **Item CRUD** example (`/api/v1/items`) behind an `item.Store` interface
- **Health check** at `/health` (and `/api/v1/health`)
- **CORS** (`CORS_ORIGINS`, comma-separated) and request logging middleware
- **Redis** cache (`pkg/cache`) when `REDIS_URL` is set, in-memory otherwise
- **Dockerfile**: `golang:1.26-alpine` build, static binary on `alpine:3.22`,
  non-root (UID 10001), `wget` healthcheck on `/health`
- **Tests**: `go test -race ./...` over the HTTP layer, the store and config

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
`{"service":"{{PLATFORM_SLUG}}","status":"ok"}`.

### Running the image on its own

Outside a GPP project (or to debug the image alone):

```bash
make docker-build   # docker build -t {{PLATFORM_SLUG}}:latest .
make docker-run     # port 8080, uses .env when present; no database or Redis
```

## Environment variables

Read once at startup in `pkg/config/config.go`. In Docker, the root compose file
loads this folder's `.env` and then sets `DATABASE_URL` and `REDIS_URL` with the
Docker network hostnames (`{{PROJECT_SLUG}}-db`, `{{PROJECT_SLUG}}-redis`); in
`.env` gpp writes the `localhost` versions for host tools.

| Variable | Default | Purpose |
| --- | --- | --- |
| `SERVER_ADDR` | `:8080` | Listen address. Keep `:8080` under compose (port mapping and healthcheck use it) |
| `SERVER_READ_TIMEOUT` / `SERVER_WRITE_TIMEOUT` | `10s` / `30s` | Go durations |
| `LOG_LEVEL` | `info` | `debug`, `info`, `warn`, `error` |
| `LOG_FORMAT` | `json` | `json` or `text` |
| `CORS_ORIGINS` | empty | Comma-separated allowed origins; empty or `*` allows any |
| `DATABASE_URL` | empty | Postgres URL (`postgresql://user:pass@host:5432/db`). Read, **not used yet**: see below |
| `REDIS_URL` | empty | `redis://host:6379/0`. Empty, or Redis unreachable at startup, falls back to the in-memory cache |

### Database: the seam

The starter keeps items in memory (`item.Service`), so it runs and tests without
Postgres. The HTTP layer depends only on `item.Store`:

```go
type Store interface {
	List() []Item
	Get(id string) (Item, bool)
	Create(req CreateRequest) Item
	Update(id string, req UpdateRequest) (Item, bool)
	Delete(id string) bool
}
```

To use Postgres, open `cfg.DatabaseURL` in `cmd/server/main.go` (for example
`database/sql` with `github.com/jackc/pgx/v5/stdlib`, or sqlx/GORM), implement
`item.Store` on it and pass it as `api.Config.Items`. Add migrations with your
tool of choice (goose, golang-migrate). Implementations should return copies,
as `item.Service` does, so handlers never share memory with the store.

### Redis

`main.go` calls `cache.Init(cfg.RedisURL, logger)`. With a reachable Redis the
package-level helpers (`cache.Get/Set/Delete/DeletePattern`) use it; otherwise
they use memory and log a warning. `/health` does not depend on Redis or the
database: readiness of those is compose's job (`depends_on: service_healthy`).

## Tests (test-first)

```bash
make test          # go vet ./... && go test -race ./...   (local Go with cgo)
make test-docker   # the same inside golang:1.26, no local Go needed
```

- `internal/api/server_test.go`: health, item routes (status codes, validation,
  JSON shape), routing 404/405, CORS and preflight, concurrent requests (for
  `-race`), and one round trip over a real `httptest.Server`
- `internal/item/item_test.go`: the in-memory store
- `pkg/config/config_test.go`: env parsing and defaults

Tests are table-driven and use only the standard library. Write the failing
handler test first, then the code. For a database-backed store, keep the HTTP
tests on the in-memory store and test the new store separately against a
Postgres container.

## API

| Method | Path | Success | Errors |
| --- | --- | --- | --- |
| GET | `/health`, `/api/v1/health` | 200 `{"status":"ok","service":"..."}` | |
| GET | `/api/v1/items` | 200 `{"items":[...],"count":n}` (oldest first) | |
| POST | `/api/v1/items` | 201 item | 400 missing/blank `name` or bad JSON, 413 body over 1 MiB |
| GET | `/api/v1/items/{id}` | 200 item | 404 |
| PUT | `/api/v1/items/{id}` | 200 item (partial update) | 400 blank `name` or bad JSON, 404 |
| DELETE | `/api/v1/items/{id}` | 204 | 404 |

An item is `{"id","name","description?","status","metadata?","created_at","updated_at"}`;
`status` defaults to `"active"`. Errors are `{"error":"message"}`. A wrong
method on a known path is 405; `OPTIONS` on any path is a 204 CORS preflight.

## Project structure

```
cmd/server/main.go        # config, cache, store wiring, graceful shutdown
internal/api/server.go    # routes, middleware (CORS, logging), handlers
internal/item/item.go     # Item, Store interface, in-memory Service
pkg/config/config.go      # env configuration
pkg/cache/cache.go        # Redis / in-memory cache
Dockerfile, .dockerignore
Makefile, .air.toml       # make targets; hot reload on the host (optional)
```

## Host-only Go (explicit exception only)

If your team has explicitly opted out of the Docker-only rule: `make run`, or
`make dev` with [air](https://github.com/air-verse/air) for hot reload.
