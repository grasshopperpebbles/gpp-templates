# SaaS Dashboard - Next.js Template

A comprehensive Next.js template for building customer-facing SaaS application dashboards.

## Features

- ✅ Authentication (JWT-based AuthContext)
- ✅ Protected routes
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
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
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

The template includes a JWT-based authentication context (`AuthContext.tsx`). You'll need to:

1. Implement the `login` function in `contexts/AuthContext.tsx` to call your API
2. Update `lib/api.ts` to properly handle token storage and refresh
3. The API client automatically includes the Bearer token in requests

## API Integration

### REST API

The REST API client in `lib/api.ts` is configured to work with Express or FastAPI backends. Update the `API_BASE_URL` in your environment variables to point to your backend.

### GraphQL (Optional)

A GraphQL client is available in `lib/graphql.ts` for connecting to GraphQL endpoints (FastAPI with Strawberry/Ariadne, Strapi, etc.).

**Setup:**
1. Set environment variable:
```env
NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:8000/graphql
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

1. **Implement Authentication**: Connect the auth context to your API
2. **Customize Dashboard**: Update dashboard pages with your data and metrics
3. **Add Charts**: Use Recharts to visualize your data
4. **Implement Admin Features**: Add team management and billing pages
5. **Add Real-time**: Implement WebSocket or polling for live data updates

## Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Recharts Documentation](https://recharts.org/)
