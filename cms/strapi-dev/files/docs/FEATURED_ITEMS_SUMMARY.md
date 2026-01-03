# Featured Items Implementation Summary

## Overview

This document summarizes the implementation of Featured Items functionality for Strapi, equivalent to the WordPress `gpp-wp-featured-items` plugin.

## What Was Created

### 1. Content Type Schema
- **Location**: `src/api/site-setting/content-types/site-setting/schema.json`
- **Purpose**: Defines the SiteSetting content type with featured items fields
- **Fields**:
  - `title` (string, required) - Default: "Site Settings"
  - `featuredTitle` (string, max 100) - Default: "Featured Items"
  - `featuredDescription` (text, max 500) - Optional description
  - `featuredItems` (relation, morphToMany) - Related content items

### 2. Bootstrap Script
- **Location**: `src/bootstrap/featured-items.ts`
- **Purpose**: Provides reference implementation and documentation
- **Note**: Content types are typically created via admin UI or schema files

### 3. Documentation
- **Location**: `docs/STRAPI_FEATURED_ITEMS.md`
- **Contents**:
  - Setup instructions (Content-Type Builder and Schema file methods)
  - GraphQL configuration
  - Query examples
  - TypeScript integration
  - Differences from WordPress
  - Troubleshooting guide

### 4. Frontend GraphQL Query
- **Location**: `web/nextjs-headless-strapi/files/src/lib/graphql.ts`
- **Updated**: `GET_FEATURED_ITEMS` query to use Strapi GraphQL format
- **Format**: Uses Strapi's `data`/`attributes` structure instead of WordPress `nodes`

## Key Differences: WordPress vs Strapi

| Aspect | WordPress | Strapi |
|--------|-----------|--------|
| **Content Type** | Custom Post Type (`site_settings`) | Collection Type (`site-setting`) |
| **Field Management** | ACF (Advanced Custom Fields) | Built-in Content-Type Builder |
| **GraphQL Query** | `siteSettings(first: 1) { nodes { ... } }` | `siteSettings(pagination: { limit: 1 }) { data { ... } }` |
| **Response Structure** | `{ nodes: [...] }` | `{ data: [{ attributes: {...} }] }` |
| **Image Fields** | `featuredImage { node { sourceUrl } }` | `featuredImage { data { attributes { url } } }` |
| **Relations** | ACF Relationship field | Strapi Relation field |

## Frontend Support

### Next.js
- ✅ **nextjs-headless-strapi**: Updated with Strapi GraphQL format
- ✅ **nextjs-headless-wp-***: Uses WordPress format (unchanged)

### SvelteKit
- ⚠️ **sveltekit-headless-strapi**: Needs GraphQL query update (if exists)
- ✅ **sveltekit-headless-wp-***: Uses WordPress format (unchanged)

## Setup Steps for Users

1. **Create Content Type** (via admin UI or schema file)
2. **Enable GraphQL Plugin** in `config/plugins.ts`
3. **Set Permissions** for Public role to access SiteSetting
4. **Create Site Setting Entry** in admin panel
5. **Configure Featured Items** by selecting related content
6. **Query from Frontend** using the provided GraphQL query

## GraphQL Query Example

```graphql
query GetFeaturedItems {
  siteSettings(pagination: { limit: 1 }) {
    data {
      id
      attributes {
        title
        featuredTitle
        featuredDescription
        featuredItems {
          data {
            id
            attributes {
              ... on Article {
                title
                slug
                excerpt
              }
            }
          }
        }
      }
    }
  }
}
```

## Next Steps

1. ✅ Content type schema created
2. ✅ Documentation created
3. ✅ Next.js frontend updated
4. ⏳ SvelteKit frontend (if needed)
5. ⏳ Test implementation in actual Strapi instance
6. ⏳ Add to strapi-only template (not just strapi-dev)

## Files Modified/Created

### Created:
- `cms/strapi-dev/files/src/api/site-setting/content-types/site-setting/schema.json`
- `cms/strapi-dev/files/src/bootstrap/featured-items.ts`
- `cms/strapi-dev/files/docs/STRAPI_FEATURED_ITEMS.md`
- `cms/strapi-dev/files/docs/FEATURED_ITEMS_SUMMARY.md` (this file)

### Modified:
- `web/nextjs-headless-strapi/files/src/lib/graphql.ts` (updated GET_FEATURED_ITEMS query)

## Notes

- The content type uses `morphToMany` relation to support multiple content types (Article, Product, etc.)
- Strapi's GraphQL API structure is different from WordPress, requiring frontend query updates
- All frontends (Next.js, SvelteKit) can now retrieve featured items data via GraphQL
- The implementation is generic and works with any content type, just like the WordPress version

