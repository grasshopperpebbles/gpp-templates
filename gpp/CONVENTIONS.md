# Project Conventions

This file documents the patterns and conventions used in GPP projects.
AI assistants should read this file to understand how to extend the codebase correctly.

## UI Components (shadcn/ui)

GPP web projects use **shadcn/ui** for all UI components. Always use shadcn components instead of plain HTML elements.

### Available Components

Import from `@/components/ui/`:

| Instead of... | Use shadcn... | Import |
|---------------|---------------|--------|
| `<button>` | `<Button>` | `@/components/ui/button` |
| `<input>` | `<Input>` | `@/components/ui/input` |
| `<select>` | `<Select>` | `@/components/ui/select` |
| `<textarea>` | `<Textarea>` | `@/components/ui/textarea` |
| `<div class="card">` | `<Card>` | `@/components/ui/card` |
| `<label>` | `<Label>` | `@/components/ui/label` |
| `<input type="checkbox">` | `<Checkbox>` | `@/components/ui/checkbox` |
| `<dialog>` | `<Dialog>` | `@/components/ui/dialog` |
| `<table>` | `<Table>` | `@/components/ui/table` |

### Example Usage

```typescript
// WRONG - plain HTML
<button onClick={handleClick}>Submit</button>
<select onChange={handleChange}>
  <option value="1">Option 1</option>
</select>

// CORRECT - shadcn components
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

<Button onClick={handleClick}>Submit</Button>
<Select onValueChange={handleChange}>
  <SelectTrigger>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
  </SelectContent>
</Select>
```

### Adding New Components

```bash
npx shadcn@latest add [component-name]
```

---

## API Patterns

GPP web projects use **two API patterns** that coexist:

### 1. Generic `apiClient` (for simple calls)

Use for quick, one-off API calls or when working with template pages.

```typescript
import { apiClient } from "@/lib/api";

// GET request
const data = await apiClient.get<ResponseType>("/endpoint");

// POST request
const result = await apiClient.post<ResponseType>("/endpoint", { key: "value" });

// PATCH request
const updated = await apiClient.patch<ResponseType>("/endpoint/id", { field: "newValue" });

// DELETE request
await apiClient.delete<ResponseType>("/endpoint/id");
```

**When to use:**
- Simple CRUD operations
- Template pages (dashboard, settings, admin)
- Quick prototyping
- One-off API calls that don't warrant a domain API

### 2. Domain-specific APIs (for complex features)

Use when a feature has multiple related endpoints that benefit from type safety and centralization.

```typescript
import { trendsApi, designPromptsApi } from "@/lib/api";

// Typed methods with autocomplete
const trends = await trendsApi.getTrends("google", { limit: 10 });
const prompts = await designPromptsApi.generate({ trendIds, questions });
```

**When to use:**
- Feature has 3+ related endpoints
- Complex request/response types
- Endpoints need specialized query building
- Team needs autocomplete and type safety

### Creating a New Domain API

Add to `src/lib/api.ts`:

```typescript
/**
 * [Feature] API
 */
export const featureApi = {
  list: async (options?: { limit?: number; offset?: number }) => {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    return apiRequest<{ items: Item[] }>(`/api/v1/feature?${params.toString()}`);
  },

  getById: async (id: string) => {
    return apiRequest<{ item: Item }>(`/api/v1/feature/${id}`);
  },

  create: async (data: CreateItemInput) => {
    return apiRequest<{ item: Item }>('/api/v1/feature', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<Item>) => {
    return apiRequest<{ item: Item }>(`/api/v1/feature/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest<{ success: boolean }>(`/api/v1/feature/${id}`, {
      method: 'DELETE',
    });
  },
};
```

## Important Rules

1. **Never remove `apiClient`** - Template pages depend on it
2. **Both patterns can coexist** - Use what fits the situation
3. **Domain APIs use `apiRequest` internally** - Same auth/error handling
4. **Export all APIs from `@/lib/api`** - Single import source

---

## Adding New Routes

Use the `gpp add route` command to scaffold new pages:

```bash
# Create a page with apiClient integration
gpp add route /settings/profile

# Create a static page without API calls
gpp add route /about --static
```

Or manually:
1. Create the page file in `src/app/[route]/page.tsx`
2. Use `apiClient` for simple API calls
3. Create a domain API only if needed (3+ related endpoints)
4. Add to navigation if applicable

## Adding New Domain APIs

Use the `gpp add api` command to scaffold new domain APIs:

```bash
# Creates billingApi with CRUD methods in src/lib/api.ts
gpp add api billing
```

This generates:
- TypeScript interfaces (`Billing`, `CreateBillingInput`)
- CRUD methods (`list`, `getById`, `create`, `update`, `delete`)
- Follows existing pattern using internal `apiRequest`

---

## File Structure (Web Platform)

```
apps/web/src/
├── app/                    # Next.js pages (App Router)
│   ├── (auth)/            # Auth-required routes
│   ├── (public)/          # Public routes
│   └── api/               # API routes (if any)
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── forms/             # Form components
│   ├── layout/            # Layout components
│   └── [feature]/         # Feature-specific components
├── contexts/              # React contexts
├── hooks/                 # Custom hooks
└── lib/
    ├── api.ts             # API client and domain APIs
    ├── utils.ts           # Utility functions
    └── config.ts          # Configuration
```

---

## Authentication

- Token stored in `localStorage` as `auth_token`
- `apiRequest` automatically adds `Authorization: Bearer <token>` header
- Use `AuthContext` for auth state in components
- Protected routes check `isAuthenticated` from context
