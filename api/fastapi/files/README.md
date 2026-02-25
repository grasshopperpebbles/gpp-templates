# FastAPI

FastAPI application with SQLAlchemy, Pydantic, and comprehensive middleware.

## Features

- ✅ **FastAPI** with Python 3.11+
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
```

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

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest
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
6. **Set up Docker** - Containerize your application
7. **Add tests** - Write tests for your endpoints

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [Uvicorn Documentation](https://www.uvicorn.org/)

