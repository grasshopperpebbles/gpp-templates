# SaaS Dashboard - Next.js Template

A comprehensive Next.js template for building customer-facing SaaS application dashboards.

## Features

- ✅ NextAuth/Auth.js credentials session
- ✅ Server-side protected dashboard and admin routes
- ✅ API integration (Express/FastAPI)
- ✅ Data visualization ready (Recharts)
- ✅ Real-time data support (WebSocket/polling hooks)
- ✅ Admin features (team management, billing)
- ✅ Responsive design
- ✅ React Query for data fetching

## Getting Started

1. Install dependencies:
```bash
npm install
# or
pnpm install
```

2. Copy environment variables:
```bash
cp env.example.txt .env.local
```

3. Update `.env.local` with your API configuration:
```env
API_URL=http://api:3001/api/v1
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-a-long-random-secret
```

4. Run the development server:
```bash
npm run dev
# or
pnpm dev
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard pages
│   ├── settings/          # User settings
│   ├── admin/             # Admin pages (for admin users)
│   ├── login/             # Authentication
│   └── register/
├── components/            # React components
│   ├── dashboard/         # Dashboard-specific components
│   ├── admin/             # Admin components
│   └── ui/                # Reusable UI components
├── lib/                   # Utilities
│   └── api.ts             # API client
├── hooks/                 # Custom React hooks
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication context
└── types/                 # TypeScript types
```

## Authentication

The template uses a single NextAuth credentials session flow backed by your API.

1. `src/lib/auth-config.ts` calls your backend at `/auth/login`
2. `src/contexts/AuthContext.tsx` exposes a simple `useAuth()` wrapper for app code
3. Protected dashboard and admin segments are enforced on the server
4. The API access token stays in NextAuth's encrypted, HTTP-only cookie; the session that page scripts can read does not include it. Browser requests go through `/api/backend/...` on this origin, where `src/lib/forward.ts` adds the token on the server

## API Integration

### REST API

`apiClient.get("/users/me")` in `lib/api.ts` calls `/api/backend/users/me` on this app's origin, which forwards it to `API_URL/users/me` with the signed-in user's token (signed-out requests, such as register, go without one). Writes must come from this app's own origin (`NEXTAUTH_URL`). `API_URL` is read on the server only; `NEXT_PUBLIC_API_BASE_URL` is still read as a fallback.

### GraphQL (Optional)

A GraphQL client is available in `lib/graphql.ts` for connecting to GraphQL endpoints (FastAPI with Strawberry/Ariadne, Strapi, etc.).

**Setup:**
1. Set environment variable (server only; queries go through `/api/graphql`, which adds the token):
```env
GRAPHQL_ENDPOINT=http://localhost:8000/graphql
```

2. Use the GraphQL client:
```typescript
import { graphqlClient } from '@/lib/graphql';

// Set auth token
graphqlClient.setAuthToken("your-bearer-token");

// Query
const data = await graphqlClient.query(`
  query GetUsers {
    users {
      id
      email
    }
  }
`);

// Mutation
const result = await graphqlClient.mutate(`
  mutation CreateUser($email: String!) {
    createUser(email: $email) {
      id
    }
  }
`, { email: "user@example.com" });
```

**Supported backends:**
- FastAPI (with Strawberry or Ariadne GraphQL)
- Strapi (with GraphQL plugin)
- Any GraphQL endpoint

## Next Steps

1. **Verify auth endpoints**: Confirm `/auth/login`, `/auth/register`, and `/users/me` match your backend
2. **Customize Dashboard**: Update dashboard pages with your data and metrics
3. **Add Charts**: Use Recharts to visualize your data
4. **Implement Admin Features**: Add team management and billing pages
5. **Add Real-time**: Implement WebSocket or polling for live data updates

## Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Recharts Documentation](https://recharts.org/)
