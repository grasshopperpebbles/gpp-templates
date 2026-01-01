# FastAPI (GPP scaffold)

## Quick Start (Docker)

```bash
# 1. Setup environment
cp .env.example .env

# 2. Start services
docker compose up --build -d

# 3. Verify with smoke test
pip install requests  # if not installed
python scripts/smoke_test.py
```

## Run (local)

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Smoke Test

After starting the API, run the smoke test to verify everything works:

```bash
# Default (localhost:8000)
python scripts/smoke_test.py

# Custom URL
python scripts/smoke_test.py --base-url http://localhost:8000

# With admin credentials
python scripts/smoke_test.py --admin-email admin@example.com --admin-password changeme
```

The smoke test verifies:
- Health endpoint responds correctly
- Authentication works (login, token validation)
- Protected endpoints enforce authentication
- Token refresh works

## REST API Endpoints

- GET /api/v1/health - Health check
- POST /api/v1/auth/login - Login (returns access_token, refresh_token)
- POST /api/v1/auth/refresh - Refresh access token
- GET /api/v1/auth/me - Get current user (protected)
- GET /api/v1/users/me - Get current user (protected)

## GraphQL (Optional)

To enable GraphQL support:

1. **Install Strawberry GraphQL:**
```bash
pip install 'strawberry-graphql[fastapi]'
```

2. **Uncomment GraphQL router in `app/main.py`:**
```python
from app.graphql.schema import get_graphql_router
graphql_router = get_graphql_router()
app.include_router(graphql_router, prefix="/graphql")
```

3. **Access GraphQL:**
- GraphQL endpoint: `http://localhost:8000/graphql`
- Apollo Sandbox IDE: `http://localhost:8000/graphql` (interactive playground)

### GraphQL Queries

**Hello Query:**
```graphql
query {
  hello
}
```

**Get Current User (requires authentication):**
```graphql
query {
  me {
    id
    email
    isActive
  }
}
```

### GraphQL Mutations

**Login:**
```graphql
mutation {
  login(input: { email: "user@example.com", password: "password" }) {
    accessToken
    tokenType
  }
}
```

### Authentication

GraphQL uses Bearer token authentication (same as REST API):
- Include `Authorization: Bearer <token>` header in requests
- Token obtained from `/api/v1/auth/login` (REST) or `login` mutation (GraphQL)

### Notes

- GraphQL is **optional** - REST API remains the default
- Both REST and GraphQL can be used simultaneously
- GraphQL schema mirrors REST API functionality
- Authentication tokens work for both REST and GraphQL
