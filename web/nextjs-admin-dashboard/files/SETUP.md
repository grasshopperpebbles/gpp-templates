# 🚀 Admin Dashboard Setup

## Required: Generate CRUD Operations

This admin dashboard template requires CRUD generation from your database schema.

### Step 1: Ensure Prisma Schema Exists

Your project should have a Prisma schema at one of these locations:
- `packages/prisma-schema/prisma/schema.prisma` (monorepo)
- `prisma/schema.prisma` (single app)
- `apps/api/prisma/schema.prisma` (API platform)

### Step 2: Generate Admin CRUD

Run the following command from your project root:

```bash
gpp admin generate-crud
```

This will generate:
- ✅ Admin pages for each database model
- ✅ List views with data tables, search, and pagination
- ✅ Create/Edit forms with validation
- ✅ Detail views
- ✅ Delete confirmation dialogs
- ✅ Zod validation schemas
- ✅ TypeScript types

### Step 3: Start Development

```bash
pnpm dev
```

Navigate to `http://localhost:3000/admin` to see your admin dashboard.

---

## What Gets Generated

For a Prisma schema like:

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  posts     Post[]
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  createdAt DateTime @default(now())
}

enum Role {
  USER
  ADMIN
}
```

You'll get:

```
src/app/admin/
├── users/
│   ├── page.tsx           # User list with table
│   ├── new/page.tsx       # Create user form
│   └── [id]/page.tsx      # Edit user form
├── posts/
│   ├── page.tsx           # Post list with table
│   ├── new/page.tsx       # Create post form
│   └── [id]/page.tsx      # Edit post form
└── layout.tsx             # Admin layout with sidebar

src/components/admin/crud/
├── UserForm.tsx           # User form component
├── UserTable.tsx          # User data table
├── PostForm.tsx           # Post form component
└── PostTable.tsx          # Post data table

src/lib/schemas/
├── user.ts                # User Zod schema
└── post.ts                # Post Zod schema
```

---

## Regenerating After Schema Changes

When you modify your Prisma schema:

```bash
# Regenerate all (preserves _custom.tsx files)
gpp admin generate-crud

# Force regenerate everything
gpp admin generate-crud --force

# Regenerate specific model
gpp admin generate-crud --model User
```

---

## Customizing Generated Code

To add custom logic without losing it on regeneration:

1. Create `_custom.tsx` files in model directories
2. Generated code will import from these files
3. Put your custom hooks, handlers, and components there

Example:
```
src/app/admin/users/
├── page.tsx           # Generated (imports from _custom.tsx)
├── _custom.tsx        # Your customizations (preserved)
└── [id]/page.tsx      # Generated
```

---

## Need Help?

- See `README.md` for full documentation
- Run `gpp admin --help` for command options
- Check [GPP CLI Documentation](https://github.com/grasshopperpebbles/gpp-cli)
