# Express API (MySQL)

Express API server with TypeScript, Prisma (MySQL), and comprehensive middleware.

## Features

- ✅ **Express.js** with TypeScript
- ✅ **Prisma ORM** with **MySQL** (`provider = "mysql"`)
- ✅ **Comprehensive Middleware Stack:**
  - Security headers (Helmet)
  - CORS configuration
  - Request ID tracking
  - Performance logging
  - Zod schema validation
  - Error handling with request IDs
  - JWT authentication
- ✅ **Type-safe routes** with TypeScript
- ✅ **Health check endpoint**
- ✅ **Graceful shutdown**

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `env.example.txt` to `.env` and configure:

```bash
cp env.example.txt .env
```

Required variables:
- `DATABASE_URL` - MySQL URL; default DB segment is `{{PROJECT_DB_SNAKE}}_api_db` after `gpp recipe apply` (project-derived, not `myapp`). Host port **3308** avoids clashing with WordPress MariaDB on **3307**.
- `JWT_SECRET` - Secret key for JWT tokens
- `API_PORT` - Server port (default: 3001)

### 3. Set Up Prisma

If you haven't already, initialize Prisma:

```bash
npx prisma init
```

Create your schema in `prisma/schema.prisma`, then:

```bash
npx prisma generate
npx prisma migrate dev
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3001` (or your configured port).

## Project Structure

```
src/
├── server.ts              # Main Express server
├── lib/
│   └── prisma.ts         # Prisma client instance
├── middleware/
│   ├── auth.middleware.ts           # JWT authentication
│   ├── error-handler.middleware.ts   # Error handling
│   ├── request-logger.middleware.ts  # Request logging
│   └── validation.middleware.ts     # Zod validation
├── routes/
│   ├── health.routes.ts   # Health check
│   └── v1/
│       ├── index.ts      # API v1 router
│       └── users.routes.ts  # Example user routes
└── schemas/
    └── index.ts          # Zod validation schemas
```

## API Endpoints

### Health Check

```bash
GET /health
```

### Users (Requires Authentication)

```bash
# List users
GET /api/v1/users?page=1&limit=10

# Get user by ID
GET /api/v1/users/:id

# Create user
POST /api/v1/users
Content-Type: application/json
Authorization: Bearer <token>

{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securepassword"
}

# Update user
PATCH /api/v1/users/:id
Authorization: Bearer <token>

{
  "name": "Jane Doe"
}

# Delete user
DELETE /api/v1/users/:id
Authorization: Bearer <token>
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### Getting a Token

You'll need to implement a login endpoint that:
1. Validates user credentials
2. Generates a JWT token using `jsonwebtoken`
3. Returns the token to the client

Example:

```typescript
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET!,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);
```

### Using the Token

Include the token in the `Authorization` header:

```
Authorization: Bearer <your-token>
```

## Middleware

### Error Handling

All errors are automatically caught and formatted:

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

All requests are automatically logged with:
- HTTP method and status code
- Response time
- Request path

Performance indicators:
- ⚡ Fast (< 100ms)
- ✓ Normal (100-500ms)
- • Moderate (500-2000ms)
- ⏱️ Slow (2000-5000ms)
- 🐌 Very Slow (> 5000ms)

## Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run type-check` - Type check without building

### Adding New Routes

1. Create route file in `src/routes/v1/`
2. Import and mount in `src/routes/v1/index.ts`
3. Add validation schemas in `src/schemas/index.ts`

Example:

```typescript
// src/routes/v1/posts.routes.ts
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { asyncHandler } from '../../middleware/error-handler.middleware.js';

const router = Router();

router.get('/', authenticate, asyncHandler(async (req, res) => {
  // Your route logic
}));

export default router;
```

## Production Deployment

### Environment Variables

Set these in your production environment:

- `NODE_ENV=production`
- `DATABASE_URL` - Production database
- `JWT_SECRET` - Strong secret key
- `CORS_ORIGINS` - Comma-separated allowed origins
- `API_PORT` - Server port

### Build

```bash
npm run build
npm start
```

### Database Migrations

```bash
npx prisma migrate deploy
```

## Testing

Example test using Jest and Supertest:

```typescript
import request from 'supertest';
import app from '../src/server';

describe('GET /health', () => {
  it('should return 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
```

## Next Steps

1. **Set up Prisma schema** - Define your database models
2. **Implement authentication** - Add login/register endpoints
3. **Add your routes** - Create routes for your application
4. **Add validation schemas** - Define Zod schemas for your data
5. **Set up Docker** - Containerize your application
6. **Add tests** - Write tests for your endpoints

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Ensure database is running
- Check Prisma client is generated: `npx prisma generate`

### Port Already in Use

Change `API_PORT` in `.env` or kill the process using the port.

### TypeScript Errors

Run `npm run type-check` to see all TypeScript errors.

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Zod Documentation](https://zod.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
