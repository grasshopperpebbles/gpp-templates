# FastAPI

FastAPI application with SQLAlchemy, Pydantic, and comprehensive middleware.

## Features

- ✅ **FastAPI** with Python 3.12
- ✅ **SQLAlchemy** (async) for database access
- ✅ **Pydantic** models for validation
- ✅ **Alembic** for database migrations
- ✅ **Comprehensive Middleware Stack:**
  - CORS configuration
  - Request logging
  - Error handling
  - JWT authentication
- ✅ **Type-safe routes** with Pydantic
- ✅ **Health check endpoint**
- ✅ **OpenAPI/Swagger documentation** (auto-generated)
- ✅ **Async/await support**
- ✅ **Redis** async client (`app/core/redis.py`), reported in `/health`
- ✅ **Dockerfile** (python:3.12-slim, non-root) and **pytest** setup

## Quick Start

### 1. Create Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Set Up Environment Variables

Copy `env.example.txt` to `.env` and configure:

```bash
cp env.example.txt .env
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `HOST` - Server host (default: 0.0.0.0)
- `PORT` - Server port (default: 8000)
- `REDIS_URL` - Redis connection string (default `redis://localhost:6379/0`; empty disables Redis)

### 4. Set Up Database

Initialize Alembic and create migrations:

```bash
# Initialize Alembic (if not already done)
alembic revision --autogenerate -m "Initial migration"

# Run migrations
alembic upgrade head
```

### 5. Start Development Server

```bash
# Using uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or using the main module
python -m app.main
```

The server will start on `http://localhost:8000`.

- API: http://localhost:8000/api/v1
- Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

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
│   └── models/          # SQLAlchemy models
├── api/
│   └── v1/
│       ├── api.py       # API v1 router
│       └── endpoints/   # API endpoints
│           ├── health.py
│           └── users.py
└── schemas/
    └── user.py          # Pydantic schemas
alembic/                 # Alembic migrations
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

### Users (Requires Authentication)

```bash
# List users
GET /api/v1/users?skip=0&limit=10
Authorization: Bearer <token>

# Get current user
GET /api/v1/users/me
Authorization: Bearer <token>

# Create user
POST /api/v1/users
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securepassword"
}
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### Creating a Token

You'll need to implement a login endpoint that:
1. Validates user credentials
2. Generates a JWT token using `app.core.security.create_access_token()`
3. Returns the token to the client

Example:

```python
from datetime import timedelta
from app.core.security import create_access_token, verify_password

# After validating credentials
access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
access_token = create_access_token(
    data={"sub": user.email, "user_id": str(user.id)},
    expires_delta=access_token_expires,
)
```

### Using the Token

Include the token in the `Authorization` header:

```
Authorization: Bearer <your-token>
```

## Database Migrations

### Create a Migration

```bash
alembic revision --autogenerate -m "Add users table"
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

Tests use httpx `AsyncClient` against the app in-process; Redis is faked and
Postgres is never contacted, so no services need to be running.

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
Shared fixtures live in `tests/conftest.py` (`client`, `fake_redis`).

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
4. **Set up authentication** - Implement login/register endpoints
5. **Add Celery integration** - For background tasks (optional)
6. **Add tests** - Test-first, alongside `tests/test_health.py`

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [Uvicorn Documentation](https://www.uvicorn.org/)

