# FastAPI

FastAPI application with SQLAlchemy, Pydantic, JWT auth, Redis and a Dockerfile.

## Features

- ✅ **FastAPI** with Python 3.12
- ✅ **SQLAlchemy** (async) for database access
- ✅ **Pydantic** models for validation
- ✅ **Alembic** for database migrations
- ✅ **CORS** configuration (`CORS_ORIGINS`, comma-separated)
- ✅ **JWT authentication**: register, login, refresh and `/me`, backed by a `User` model and an initial migration
- ✅ **Type-safe routes** with Pydantic
- ✅ **Health check endpoint**
- ✅ **OpenAPI/Swagger documentation** (auto-generated)
- ✅ **Async/await support**
- ✅ **Redis** async client (`app/core/redis.py`), reported in `/health`
- ✅ **Dockerfile** (python:3.12-slim, non-root) and **pytest** setup

## Quick Start (GPP: run the API in Docker)

In GPP monorepos, **backend processes run in containers** — do not install Python or use `pip install` on your host to **serve** this API. Source code lives here for editing and Git; **execution** is via Docker Compose from the **repository root** (see root `docker-compose.yml` and `gpp start api`).

### 1. Start services from the monorepo root

```bash
cd /path/to/project-root
docker compose up -d
```

The API runs as the `{{PROJECT_SLUG}}-api` service, built from this folder's `Dockerfile`, next to `{{PROJECT_SLUG}}-db` (and `{{PROJECT_SLUG}}-redis` when the project uses Redis). `gpp doctor` and `.gpp/deploy.json` help confirm paths.

### 2. Environment variables

gpp writes `DATABASE_URL` (and `REDIS_URL`) into this folder's `.env` / `.env.example`; `env.example.txt` lists every setting. Inside the container, `DATABASE_URL` and `REDIS_URL` must use the **Docker network** hostnames (`{{PROJECT_SLUG}}-db`, `{{PROJECT_SLUG}}-redis`), not `localhost`; the root compose file sets them for the API service.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string (`postgresql+psycopg://...`) |
| `JWT_SECRET` | Secret key for JWT tokens (change it) |
| `REDIS_URL` | Redis connection string (empty disables Redis) |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `HOST` / `PORT` | Server bind address (default `0.0.0.0:8000`) |

### 3. Migrations (inside the running API container)

The pack ships an initial migration that creates the `users` table:

```bash
docker compose exec {{PROJECT_SLUG}}-api alembic upgrade head
```

### 4. Verify

- Health: `http://localhost:8000/health`
- API: `http://localhost:8000/api/v1`
- Docs: `/docs`, ReDoc: `/redoc`

### Host-only Python (explicit exception only)

If your team has **explicitly** opted out of the Docker-only rule, you may use a virtualenv, `pip install -r requirements.txt`, `alembic upgrade head`, and `uvicorn app.main:app --reload` on the host. That is **not** the GPP default.

## Project Structure

```
app/
├── main.py              # FastAPI application entry point
├── core/
│   ├── config.py        # Settings (Pydantic Settings)
│   ├── deps.py          # FastAPI dependencies
│   ├── logging.py       # Logging configuration
│   ├── redis.py         # Async Redis client
│   └── security.py      # Password hashing, JWT tokens
├── db/
│   ├── base.py          # SQLAlchemy base and session
│   ├── session.py       # Database session dependency
│   └── models/          # SQLAlchemy models (user.py)
├── api/
│   └── v1/
│       ├── api.py       # API v1 router
│       └── endpoints/   # API endpoints
│           ├── auth.py
│           ├── health.py
│           └── users.py
└── schemas/
    ├── auth.py          # Login/refresh/token schemas
    └── user.py          # User schemas
alembic/                 # Alembic migrations (versions/0001_create_users.py)
tests/                   # pytest (health, Redis, CORS, auth)
```

## API Endpoints

### Health Check

```bash
GET /health
# {"status": "ok", "redis": "ok" | "unavailable" | "disabled"}
```

Always 200 while the app is up. Redis being down shows `"redis": "unavailable"`
but does not fail the check; DB/Redis readiness is docker compose's job
(`depends_on: condition: service_healthy`).

### API Documentation

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **OpenAPI JSON:** http://localhost:8000/openapi.json

### Auth

```bash
# Register (201): returns access_token, refresh_token and the user; 409 if the email exists
POST /api/v1/auth/register
{"email": "user@example.com", "name": "Jane Doe", "password": "securepassword"}

# Login (200): returns access_token and refresh_token; 401 bad credentials, 403 disabled account
POST /api/v1/auth/login
{"email": "user@example.com", "password": "securepassword"}

# New access token from a refresh token
POST /api/v1/auth/refresh
{"refresh_token": "<refresh-token>"}

# Current user
GET /api/v1/auth/me
Authorization: Bearer <token>
```

### Users (Requires Authentication)

```bash
# List users
GET /api/v1/users?skip=0&limit=10

# Get / update the current user (name, email, password)
GET /api/v1/users/me
PATCH /api/v1/users/me
```

## Authentication

JWT bearer tokens (`python-jose`, HS256) with bcrypt password hashing
(`passlib`). Access tokens last `ACCESS_TOKEN_EXPIRE_MINUTES`, refresh tokens
(`"type": "refresh"`) `REFRESH_TOKEN_EXPIRE_DAYS`. `app.core.deps.get_current_user`
resolves the token's `sub` to a `User` row; use it as a dependency to protect
routes:

```python
from app.core.deps import get_current_user
from app.db.models.user import User

@router.get("/private")
async def private(current_user: User = Depends(get_current_user)):
    ...
```

Include the token in the `Authorization` header:

```
Authorization: Bearer <your-token>
```
## Database Migrations

`alembic/versions/0001_create_users.py` creates the `users` table. After changing
models, generate a new revision (inside the API container in GPP projects):

### Create a Migration

```bash
alembic revision --autogenerate -m "Add posts table"
```

### Apply Migrations

```bash
alembic upgrade head
```

### Rollback a Migration

```bash
alembic downgrade -1
```

## Development

### Running Tests

Tests use httpx `AsyncClient` against the app in-process; Redis is faked,
Postgres is never contacted and the auth tests run against an in-memory SQLite
database (`aiosqlite`), so no services need to be running. Warnings fail the
run (`pytest.ini`), apart from two known deprecations in passlib and python-jose.

```bash
pip install -r requirements-dev.txt
pytest
```

Without a local Python 3.12, run them in a container:

```bash
docker run --rm -v "$PWD:/src:ro" python:3.12 sh -c \
  "cp -R /src /w && cd /w && pip install -q -r requirements-dev.txt && pytest"
```

Write the test first (`tests/test_*.py`), see it fail, then implement.
Shared fixtures live in `tests/conftest.py` (`client`, `fake_redis`, `db`).

## Docker

The `Dockerfile` builds a production image (python:3.12-slim, runtime deps
only, non-root user) that runs `uvicorn app.main:app --host 0.0.0.0 --port 8000`
and has a `HEALTHCHECK` on `/health` (Python `urllib`, no curl needed).

```bash
docker build -t {{PROJECT_SLUG}}-api .
docker run --rm --env-file .env -p 8000:8000 {{PROJECT_SLUG}}-api
```

In a gpp project the API runs as the `{{PROJECT_SLUG}}-api` service in the root
`docker-compose.yml`, next to `{{PROJECT_SLUG}}-db` and `{{PROJECT_SLUG}}-redis`.
Inside compose, `.env` must point at the service names:

```bash
DATABASE_URL=postgresql+psycopg://postgres:postgres@{{PROJECT_SLUG}}-db:5432/postgres
REDIS_URL=redis://{{PROJECT_SLUG}}-redis:6379/0
```

Migrations do not run on container start. Apply them explicitly:

```bash
docker compose exec {{PROJECT_SLUG}}-api alembic upgrade head
```

## Redis

`app/core/redis.py` exposes `get_redis()` (a lazily created
`redis.asyncio.Redis`, or `None` when `REDIS_URL` is empty), `redis_status()`
and `close_redis()` (called on app shutdown). Use it for caching, rate limits
or queues:

```python
from app.core.redis import get_redis

redis = get_redis()
if redis is not None:
    await redis.set("key", "value", ex=60)
```

### Code Formatting

```bash
# Install formatter
pip install black

# Format code
black app/
```

### Type Checking

```bash
# Install type checker
pip install mypy

# Type check
mypy app/
```

## Production Deployment

### Environment Variables

Set these in your production environment:

- `DEBUG=false`
- `DATABASE_URL` - Production database
- `JWT_SECRET` - Strong secret key
- `CORS_ORIGINS` - Comma-separated allowed origins
- `HOST` - Server host
- `PORT` - Server port

### Running in Production

```bash
# Using uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# Or using gunicorn with uvicorn workers
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Database Migrations

```bash
alembic upgrade head
```

## Next Steps

1. **Define your models** - Add SQLAlchemy models in `app/db/models/`
2. **Create schemas** - Add Pydantic schemas in `app/schemas/`
3. **Implement endpoints** - Create endpoints in `app/api/v1/endpoints/`
4. **Add Celery integration** - For background tasks (optional)
5. **Add tests** - Test-first, alongside `tests/test_health.py` and `tests/test_auth.py`

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [Uvicorn Documentation](https://www.uvicorn.org/)

