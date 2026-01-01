# Content Routes Configuration

This document describes the content routing system for headless WordPress sites.

## Route Structure

### Blog Routes (`/blog`)

| Route | Purpose | Example |
|-------|---------|---------|
| `/blog` | Blog listing page | `/blog` |
| `/blog/[category]` | Category listing | `/blog/travel` |
| `/blog/[category]/[subcategory]` | Subcategory listing | `/blog/travel/europe` |
| `/blog/[category]/[post]` | Post in category | `/blog/travel/paris-guide` |
| `/blog/[category]/[subcategory]/[post]` | Post in subcategory | `/blog/travel/europe/paris-guide` |

### Article Routes (`/article`)

| Route | Purpose | Example |
|-------|---------|---------|
| `/articles` | Articles listing page | `/articles` |
| `/article/[category]` | Category listing | `/article/business` |
| `/article/[category]/[subcategory]` | Subcategory listing | `/article/business/startups` |
| `/article/[category]/[post]` | Post in category | `/article/business/funding-guide` |
| `/article/[category]/[subcategory]/[post]` | Post in subcategory | `/article/business/startups/seed-funding` |

## Choosing Blog vs Article

During `gpp cms configure`, you choose between `/blog` or `/article` routes:

- **Blog** - Traditional blog format, casual content
- **Article** - Professional/educational content, documentation-style

Only ONE is active at a time. The other routes are removed.

## Technical Implementation

### Catch-All Routes

Both `/blog` and `/article` use Next.js catch-all routes:

```
/blog/[...slug]/page.tsx     # Handles all /blog/* paths
/article/[...slug]/page.tsx  # Handles all /article/* paths
```

### Path Resolution

The `resolvePathSegments()` function in `@/lib/posts.ts` determines what each path represents:

```typescript
import { resolvePathSegments } from '@/lib/posts'

// /blog/travel/europe/paris-guide
const resolved = await resolvePathSegments(['travel', 'europe', 'paris-guide'])

// Returns:
// {
//   type: 'post',
//   post: { ... },           // The post object
//   category: { ... },       // Parent category (travel)
//   subcategory: { ... },    // Child category (europe)
//   categoryPath: ['travel', 'europe']
// }
```

### Resolution Types

| Type | Description |
|------|-------------|
| `post` | Individual post/article |
| `category` | Top-level category listing |
| `subcategory` | Child category listing |
| `not_found` | Path doesn't match any content |

### Building Post URLs

Use `buildPostPath()` to generate SEO-friendly URLs:

```typescript
import { buildPostPath } from '@/lib/posts'

// Post in category "travel" with subcategory "europe"
const url = buildPostPath(post, '/blog')
// Returns: /blog/travel/europe/paris-guide
```

## WordPress Category Structure

The route structure maps to WordPress categories:

1. **Root categories** become first-level paths: `/blog/travel`
2. **Child categories** become second-level paths: `/blog/travel/europe`
3. **Posts** use their category hierarchy: `/blog/travel/europe/post-slug`

### Setting Up Categories in WordPress

1. Create parent categories (e.g., "Travel", "Business")
2. Create child categories under parents (e.g., "Europe" under "Travel")
3. Assign posts to the most specific category

## AI Assistant Notes

When working with content routes:

1. **Use `resolvePathSegments()`** to determine content type from URL
2. **Use `buildPostPath()`** to generate canonical URLs for posts
3. **Check `.gpp/deploy.json`** for `contentBase` setting (`blog` or `article`)
4. **Category paths are validated** - invalid hierarchies return `not_found`
5. **Posts can exist without categories** - they'll be accessible at `/blog/[post-slug]`

### Common Operations

```typescript
// Get all categories
const categories = await getCategories()

// Get posts in a category
const posts = await getPostsByCategory('travel')

// Get subcategories
const subcats = await getSubcategories('travel')

// Resolve a URL path
const resolved = await resolvePathSegments(['travel', 'europe', 'my-post'])
```

## Migration Notes

If migrating from the old route structure:

**Old:**
- `/blog/[slug]` - direct post access
- `/blog/[category]` - category page
- `/blog/category/[slug]` - alternate category page

**New:**
- `/blog/[...slug]` - catch-all handles all patterns
- Categories in URL path for SEO
- Subcategory support built-in
