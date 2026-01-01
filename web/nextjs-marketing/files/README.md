# Generic Next.js App

A flexible, standalone Next.js application template for GPP projects.

## Features

- ✅ Basic Next.js structure
- ✅ Home page
- ✅ About page
- ✅ Privacy policy page
- ✅ Terms of service page
- ✅ Contact page
- ✅ Site header with navigation
- ✅ Site footer with links
- ✅ Optional API client
- ✅ Optional WordPress client
- ✅ TypeScript support
- ✅ Tailwind CSS
- ✅ Responsive design

## Getting Started

1. Install dependencies:
```bash
npm install
# or
pnpm install
```

2. Run the development server:
```bash
npm run dev
# or
pnpm dev
```

## Optional Integration

### REST API Integration

If you need to connect to a FastAPI or Express API:

1. Set environment variable:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
```

2. Use the REST API client:
```typescript
import { api } from '@/lib/clients/api';
```

### GraphQL Integration

If you need to connect to a GraphQL endpoint (FastAPI, Strapi, etc.):

1. Set environment variable:
```env
NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:8000/graphql
```

2. Use the GraphQL client:
```typescript
import { graphqlClient } from '@/lib/clients/graphql';

// Query
const data = await graphqlClient.query(`
  query GetUsers {
    users {
      id
      email
      name
    }
  }
`);

// Mutation
const result = await graphqlClient.mutate(`
  mutation CreateUser($email: String!, $name: String!) {
    createUser(email: $email, name: $name) {
      id
      email
    }
  }
`, { email: "user@example.com", name: "John Doe" });

// Set authentication token
graphqlClient.setAuthToken("your-bearer-token");
```

**Supported backends:**
- FastAPI (with Strawberry/Ariadne)
- Strapi (with GraphQL plugin)
- WordPress (WPGraphQL)
- Any GraphQL endpoint

### WordPress Integration

If you need to connect to WordPress GraphQL (legacy):

1. Set environment variable:
```env
NEXT_PUBLIC_WP_GRAPHQL_ENDPOINT=http://localhost:8080/graphql
```

2. Use the WordPress client:
```typescript
import { wpGraphql } from '@/lib/clients/wp';
```

**Note:** The generic GraphQL client (`@/lib/clients/graphql`) also works with WordPress and supports WooCommerce session tokens.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── about/             # About page
│   ├── contact/           # Contact page
│   ├── privacy/           # Privacy policy
│   ├── terms/             # Terms of service
│   ├── api/               # API routes (optional)
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── site-header.tsx   # Navigation header
│   ├── site-footer.tsx   # Footer with links
│   └── ui/               # UI components
└── lib/                   # Utilities
    ├── clients/           # API clients (optional)
    ├── env.ts             # Environment utilities
    └── http.ts            # HTTP utilities
```

## Customization

- Update homepage content in `src/app/page.tsx`
- Customize about, privacy, and terms pages
- Add your own pages and components
- Integrate with APIs or CMS as needed

## Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
