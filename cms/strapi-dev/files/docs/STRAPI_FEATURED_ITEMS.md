# Strapi Featured Items Content Type

This document describes how to set up the Featured Items functionality in Strapi, which is equivalent to the WordPress `gpp-wp-featured-items` plugin.

## Overview

The Featured Items content type allows content editors to manage a featured content section on the homepage. It includes:

- **Section Title** (`featuredTitle`) - Main heading for the featured section
- **Section Description** (`featuredDescription`) - Supporting text/description
- **Featured Items** (`featuredItems`) - Related content items (posts, products, etc.)

## Setup Instructions

### Option 1: Using Content-Type Builder (Recommended)

1. **Access Content-Type Builder**
   - Log into Strapi Admin Panel
   - Navigate to **Content-Type Builder** in the left sidebar

2. **Create New Collection Type**
   - Click **"Create new collection type"**
   - Name: `Site Setting`
   - Click **Continue**

3. **Add Fields**
   
   **Title Field:**
   - Click **Add another field**
   - Select **Text**
   - Display name: `Title`
   - Name: `title`
   - Default value: `Site Settings`
   - Mark as **Required**
   - Click **Finish**

   **Featured Title Field:**
   - Click **Add another field**
   - Select **Text**
   - Display name: `Featured Title`
   - Name: `featuredTitle`
   - Default value: `Featured Items`
   - Max length: `100`
   - Click **Finish**

   **Featured Description Field:**
   - Click **Add another field**
   - Select **Long text**
   - Display name: `Featured Description`
   - Name: `featuredDescription`
   - Max length: `500`
   - Click **Finish**

   **Featured Items Field:**
   - Click **Add another field**
   - Select **Relation**
   - Display name: `Featured Items`
   - Name: `featuredItems`
   - Relation type: **Many-to-many** (or **One-to-many** if you prefer)
   - Select the content types you want to relate (e.g., Article, Product, etc.)
   - Click **Finish**

4. **Save**
   - Click **Save** in the top right
   - Strapi will restart to apply changes

### Option 2: Using Schema File

If you prefer to use the schema file directly:

1. Copy the schema file to your Strapi project:
   ```
   src/api/site-setting/content-types/site-setting/schema.json
   ```

2. Restart Strapi to load the new content type

3. Configure the `featuredItems` relation to match your content types

## GraphQL Configuration

### Enable GraphQL Plugin

1. Install GraphQL plugin (if not already installed):
   ```bash
   npm install @strapi/plugin-graphql
   ```

2. Enable in `config/plugins.ts`:
   ```typescript
   export default ({ env }) => ({
     graphql: {
       enabled: true,
       config: {
        endpoint: '/graphql',
        shadowCRUD: true,
        playgroundAlways: false,
        depthLimit: 7,
        amountLimit: 100,
        apolloServer: {
          tracing: false,
        },
      },
    },
  });
  ```

### Set Permissions

1. Go to **Settings** → **Users & Permissions plugin** → **Roles** → **Public**
2. Under **Site Setting**, enable:
   - `find`
   - `findOne`
3. Click **Save**

## GraphQL Query Examples

### Basic Query

```graphql
query GetFeaturedItems {
  siteSettings {
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
              # Content type specific fields
              # For Article:
              title
              slug
              excerpt
              featuredImage {
                data {
                  attributes {
                    url
                    alternativeText
                  }
                }
              }
              # For Product:
              name
              slug
              price
              image {
                data {
                  attributes {
                    url
                    alternativeText
                  }
                }
              }
            }
          }
        }
      }
    }
    meta {
      pagination {
        total
      }
    }
  }
}
```

### TypeScript Example

```typescript
import { graphqlClient } from '@/lib/graphql';

const GET_FEATURED_ITEMS = `
  query GetFeaturedItems {
    siteSettings {
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
                ... on Product {
                  name
                  slug
                  price
                }
              }
            }
          }
        }
      }
    }
  }
`;

const { data } = await graphqlClient.query({
  query: GET_FEATURED_ITEMS,
});
```

## Differences from WordPress

| WordPress | Strapi |
|-----------|--------|
| `siteSettings(first: 1)` | `siteSettings(pagination: { limit: 1 })` |
| `nodes` | `data` |
| `featuredItems { nodes { ... } }` | `featuredItems { data { ... } }` |
| `featuredImage { node { sourceUrl } }` | `featuredImage { data { attributes { url } } }` |
| GraphQL field names: `featuredTitle` | Same: `featuredTitle` |

## Frontend Integration

The frontend GraphQL client should detect the CMS type and use the appropriate query format:

- **WordPress**: Uses WPGraphQL format with `nodes`, `pageInfo`
- **Strapi**: Uses Strapi GraphQL format with `data`, `attributes`

See the frontend GraphQL files for implementation details.

## Customization

### Change Default Values

Edit the content type schema or use Strapi's admin UI to modify default values.

### Limit Featured Items

The relation field supports ordering. In the admin UI, you can:
1. Select items in the desired order
2. The order is preserved in the GraphQL response

### Add More Fields

You can extend the content type with additional fields:
- `maxItems` (Number) - Maximum number of featured items
- `displayStyle` (Enum) - Grid, List, Carousel
- `showDescription` (Boolean) - Toggle description display

## Troubleshooting

### Featured items not showing in GraphQL

1. Ensure GraphQL plugin is enabled
2. Check permissions in Settings → Roles → Public
3. Verify the content type is published (if using draft/publish)
4. Check that related content types are also accessible

### Relation not working

1. Ensure both content types exist
2. Verify the relation is configured correctly
3. Check that related items are published

### GraphQL query errors

1. Verify field names match the schema
2. Check that required fields are included
3. Ensure nested relations are properly queried

## Migration from WordPress

If migrating from WordPress:

1. Export featured items data from WordPress
2. Create Site Setting entry in Strapi
3. Map WordPress post IDs to Strapi content IDs
4. Update frontend GraphQL queries to use Strapi format

## Support

For issues or questions, refer to:
- [Strapi Documentation](https://docs.strapi.io)
- [Strapi GraphQL Plugin](https://docs.strapi.io/dev-docs/plugins/graphql)

