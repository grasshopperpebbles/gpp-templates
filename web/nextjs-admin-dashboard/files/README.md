# Admin Dashboard - Next.js Template

A focused Next.js template for building platform-level admin dashboards. Designed for admin-only management interfaces, typically deployed on a separate domain.

## ⚠️ Post-Installation Setup Required

After scaffolding this template, you must generate the CRUD operations from your database schema:

```bash
# Generate admin CRUD pages and API routes from Prisma schema
gpp admin generate-crud
```

This command will:
1. Read your Prisma schema (`packages/prisma-schema/prisma/schema.prisma`)
2. Generate admin pages for each model (`app/admin/[model]/`)
3. Generate API routes for CRUD operations (`app/api/admin/[model]/`)
4. Generate form components with validation
5. Generate TypeScript types

**Without this step, the admin dashboard will have placeholder pages only.**

See [CRUD Generation Guide](#crud-generation) below for details.

---

## Features

- ✅ Admin-only authentication (NextAuth)
- ✅ User management (auto-generated)
- ✅ Full CRUD for all database tables
- ✅ System configuration
- ✅ Analytics and reporting
- ✅ API integration (Express/FastAPI)
- ✅ Server-side protected admin routes
- ✅ Responsive design
- ✅ React Query for data fetching

## Getting Started

1. Install dependencies:
```bash
pnpm install
```

2. Copy environment variables:
```bash
cp env.example.txt .env.local
```

3. Update `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
API_URL=http://api:4000/api/v1
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
```

4. **Generate CRUD operations** (required):
```bash
gpp admin generate-crud
```

5. Run the development server:
```bash
pnpm dev
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin pages (auto-generated)
│   │   ├── users/         # User management
│   │   ├── [model]/       # Other models from schema
│   │   ├── analytics/     # Analytics and reports
│   │   └── settings/      # System settings
│   ├── login/             # Admin authentication
│   └── api/               # API routes
│       └── auth/          # NextAuth routes
├── components/            # React components
│   ├── admin/             # Admin-specific components
│   │   ├── crud/          # Auto-generated CRUD components
│   │   └── forms/         # Auto-generated form components
│   ├── auth/              # Auth components
│   ├── data/              # Data display components
│   ├── feedback/          # Toast, notifications
│   ├── forms/             # Form components
│   ├── layout/            # Layout components
│   └── ui/                # UI primitives
├── hooks/                 # Custom hooks
├── lib/                   # Utilities
│   ├── api.ts             # API client
│   ├── auth-config.ts     # NextAuth configuration
│   └── config.ts          # Feature flags
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication context (wraps NextAuth)
└── types/                 # TypeScript types
    └── next-auth.d.ts     # NextAuth type extensions
```

## CRUD Generation

The `gpp admin generate-crud` command reads your Prisma schema and generates a complete admin interface.

### What Gets Generated

For each model in your Prisma schema:

| Generated File | Description |
|----------------|-------------|
| `app/admin/[model]/page.tsx` | List page with data table, search, pagination |
| `app/admin/[model]/[id]/page.tsx` | Detail/edit page |
| `app/admin/[model]/new/page.tsx` | Create new record page |
| `components/admin/crud/[Model]Form.tsx` | Form component with validation |
| `components/admin/crud/[Model]Table.tsx` | Data table component |
| `lib/schemas/[model].ts` | Zod validation schema |

### Supported Field Types

| Prisma Type | Form Input | Validation |
|-------------|------------|------------|
| `String` | Text input | Required if not optional |
| `String @db.Text` | Textarea | - |
| `Int`, `Float` | Number input | Numeric validation |
| `Boolean` | Checkbox/Switch | - |
| `DateTime` | Date picker | Date validation |
| `Json` | JSON editor | JSON validation |
| `Enum` | Select dropdown | Enum values |
| `@relation` | Relation selector | Foreign key |

### Special Field Handling

| Field Pattern | Handling |
|---------------|----------|
| `email` | Email input with validation |
| `password` | Password input (hidden in tables) |
| `@id` | Read-only, auto-generated |
| `@default(now())` | Auto-set on create |
| `@updatedAt` | Auto-updated |

### Regenerating CRUD

If you modify your Prisma schema:

```bash
# Regenerate all CRUD (preserves customizations in _custom.tsx files)
gpp admin generate-crud

# Force regenerate (overwrites all files)
gpp admin generate-crud --force

# Generate for specific model only
gpp admin generate-crud --model User
```

### Customizing Generated Code

To customize without losing changes on regeneration:

1. Create `app/admin/[model]/_custom.tsx` for custom logic
2. Generated files import from `_custom.tsx` if it exists
3. Or use `--force` flag and maintain your own version

## Authentication

Uses NextAuth with role-based access. Only users with `role: "admin"` can access.

### Configuration

Update `src/lib/auth-config.ts` to configure:
- Authentication providers (credentials, OAuth, etc.)
- Session handling
- Role verification

### Protecting Routes

All `/admin/*` routes are protected by server-side session checks. The `AuthContext` provides:

```typescript
const { user, isAdmin, isLoading, login, logout } = useAuth();

// isAdmin is true if user.role === "admin"
```

## API Integration

### REST API

Configure in `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
API_URL=http://api:4000/api/v1
```

Use the API client:
```typescript
import { apiClient } from '@/lib/api';

const users = await apiClient.get('/api/users');
```

### GraphQL (Optional)

For GraphQL backends, use the GraphQL client:
```typescript
import { graphqlClient } from '@/lib/graphql';

const data = await graphqlClient.query(`
  query GetUsers {
    users { id email }
  }
`);
```

## Next Steps

1. ✅ **Generate CRUD**: `gpp admin generate-crud`
2. Configure authentication providers in `lib/auth-config.ts`
3. Customize the dashboard layout in `app/admin/layout.tsx`
4. Add analytics/reporting features
5. Configure system settings pages

## Documentation

- [GPP CLI Documentation](https://github.com/grasshopperpebbles/gpp-cli)
- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth Documentation](https://next-auth.js.org)
- [React Query Documentation](https://tanstack.com/query/latest)
