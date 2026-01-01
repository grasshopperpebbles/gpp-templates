# GraphQL API (Optional)

This directory contains the optional GraphQL implementation for the FastAPI template.

## Installation

Install Strawberry GraphQL:
```bash
pip install 'strawberry-graphql[fastapi]'
```

## Enable GraphQL

Uncomment the GraphQL router in `app/main.py`:

```python
from app.graphql.schema import get_graphql_router
graphql_router = get_graphql_router()
app.include_router(graphql_router, prefix="/graphql")
```

## Access GraphQL

- **GraphQL Endpoint:** `http://localhost:8000/graphql`
- **Apollo Sandbox IDE:** `http://localhost:8000/graphql` (interactive playground)

## Schema Structure

### Queries
- `hello` - Simple test query
- `me` - Get current authenticated user

### Mutations
- `login` - Authenticate and get JWT token

## Authentication

GraphQL uses Bearer token authentication:
1. Get token from REST API: `POST /api/v1/auth/login`
2. Or use GraphQL mutation: `mutation { login(input: {...}) { accessToken } }`
3. Include in requests: `Authorization: Bearer <token>`

## Example Queries

### Hello Query
```graphql
query {
  hello
}
```

### Get Current User (Authenticated)
```graphql
query {
  me {
    id
    email
    isActive
  }
}
```

### Login Mutation
```graphql
mutation {
  login(input: {
    email: "user@example.com"
    password: "password"
  }) {
    accessToken
    tokenType
  }
}
```

## Extending the Schema

To add more queries/mutations:

1. **Add GraphQL Types:**
```python
@strawberry.type
class YourType:
    field1: str
    field2: int
```

2. **Add to Query or Mutation:**
```python
@strawberry.type
class Query:
    @strawberry.field
    async def your_query(self, info: strawberry.Info) -> YourType:
        db: Session = info.context.get("db")
        # Your logic here
        return YourType(...)
```

3. **Access database and user from context:**
```python
db: Session = info.context.get("db")
user: Optional[User] = info.context.get("user")
```

## Integration with Next.js

The Next.js GraphQL client can connect to this endpoint:

```typescript
// In Next.js
import { graphqlClient } from '@/lib/clients/graphql';

// Set endpoint
const client = createGraphQLClient('http://localhost:8000/graphql');

// Set auth token
client.setAuthToken('your-jwt-token');

// Query
const data = await client.query(`
  query {
    me {
      id
      email
    }
  }
`);
```

## Database Session Management

The GraphQL context creates a database session per request. For production use, consider:

1. **Using dependency injection** for session management
2. **Adding middleware** to ensure sessions are closed
3. **Using async context managers** for proper cleanup

Current implementation creates sessions in `get_graphql_context()` - ensure proper cleanup in production.

## Notes

- GraphQL is **optional** - REST API remains the default
- Both REST and GraphQL can be used simultaneously
- Authentication tokens work for both REST and GraphQL
- Database sessions are created per request in GraphQL context
- Consider implementing proper session lifecycle management for production
