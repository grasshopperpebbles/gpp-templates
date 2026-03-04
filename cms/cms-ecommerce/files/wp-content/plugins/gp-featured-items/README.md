# GP Featured Items Plugin

A generic WordPress plugin for managing featured content sections on the homepage using Advanced Custom Fields (ACF). Works with any content type (posts, products, pages, custom post types) and exposes data via WPGraphQL for headless frontends.

## Features

- ✅ **Generic & Flexible:** Works with any post type (posts, products, pages, custom post types)
- ✅ **ACF Integration:** Uses Advanced Custom Fields for easy content management
- ✅ **WPGraphQL Support:** Exposes all fields via GraphQL for headless frontends
- ✅ **Configurable:** Customize defaults via WordPress filters or environment variables
- ✅ **Admin-Friendly:** Simple WordPress admin interface for managing featured content

## Installation

1. Copy the `gp-featured-items` folder to your WordPress `wp-content/plugins/` directory
2. Activate the plugin in WordPress Admin → Plugins
3. A default "Site Settings" post will be created automatically

## Configuration

### Method 1: WordPress Filters (Recommended for themes/plugins)

Add to your theme's `functions.php` or a custom plugin:

```php
// Customize default title
add_filter('gp_featured_items_default_title', function() {
    return 'Featured Products';
});

// Customize default description
add_filter('gp_featured_items_default_description', function() {
    return 'Check out our best-selling items';
});

// Customize maximum items
add_filter('gp_featured_items_max_items', function() {
    return 6; // Default is 12
});

// Customize menu label
add_filter('gp_featured_items_menu_label', function() {
    return 'Featured Products';
});
```

### Method 2: Environment Variables (For headless setups)

Add to your `.env` file or Docker environment:

```bash
GP_FEATURED_ITEMS_TITLE="Featured Products"
GP_FEATURED_ITEMS_DESCRIPTION="Check out our best-selling items"
GP_FEATURED_ITEMS_MAX=6
GP_FEATURED_ITEMS_MENU_LABEL="Featured Products"
```

## Usage

### WordPress Admin

1. Navigate to **Featured Items** (or your custom menu label) in WordPress Admin
2. Edit the "Site Settings" post
3. Fill in:
   - **Section Title:** The heading for your featured section
   - **Section Description:** Optional description text
   - **Featured Content:** Select up to 12 items (or your custom max) from any post type
4. Save the post

### GraphQL Query

Query featured items from your headless frontend:

```graphql
query GetFeaturedItems {
  siteSettings(first: 1) {
    nodes {
      id
      databaseId
      title
      featuredItems {
        featuredTitle
        featuredDescription
        featuredItems {
          nodes {
            ... on Post {
              id
              databaseId
              title
              slug
              excerpt
              featuredImage {
                node {
                  sourceUrl
                  altText
                }
              }
            }
            ... on Product {
              id
              databaseId
              name
              slug
              shortDescription
              image {
                sourceUrl
                altText
              }
              ... on SimpleProduct {
                price
                regularPrice
                salePrice
              }
            }
          }
        }
      }
    }
  }
}
```

### TypeScript Example

```typescript
import { gql } from '@apollo/client';

const GET_FEATURED_ITEMS = gql`
  query GetFeaturedItems {
    siteSettings(first: 1) {
      nodes {
        featuredItems {
          featuredTitle
          featuredDescription
          featuredItems {
            nodes {
              ... on Post {
                id
                title
                slug
                featuredImage {
                  node {
                    sourceUrl
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

// Use in your component
const { data, loading, error } = useQuery(GET_FEATURED_ITEMS);
```

## GraphQL Schema

The plugin exposes the following GraphQL types:

### SiteSetting

```graphql
type SiteSetting {
  id: ID!
  databaseId: Int!
  title: String!
  featuredItems: FeaturedItems_Fields
}
```

### FeaturedItems_Fields

```graphql
type FeaturedItems_Fields {
  featuredTitle: String
  featuredDescription: String
  featuredItems: [Node]  # Can be Post, Product, Page, or any post type
}
```

## Customization Examples

### E-commerce Site (WooCommerce)

```php
add_filter('gp_featured_items_default_title', function() {
    return 'Featured Products';
});

add_filter('gp_featured_items_default_description', function() {
    return 'Shop our handpicked favorites';
});

add_filter('gp_featured_items_max_items', function() {
    return 8;
});
```

### Blog Site

```php
add_filter('gp_featured_items_default_title', function() {
    return 'Featured Articles';
});

add_filter('gp_featured_items_default_description', function() {
    return 'Our most popular and recent posts';
});

add_filter('gp_featured_items_max_items', function() {
    return 6;
});
```

### Portfolio Site

```php
add_filter('gp_featured_items_default_title', function() {
    return 'Featured Work';
});

add_filter('gp_featured_items_default_description', function() {
    return 'Selected projects from our portfolio';
});
```

## Requirements

- WordPress 6.0+
- PHP 7.4+
- Advanced Custom Fields (ACF) plugin
- WPGraphQL plugin
- wpgraphql-acf plugin (for ACF GraphQL support)

## Migration from Old Version

If you're upgrading from the old `featured_designs` version:

1. **Update GraphQL Queries:** Change `featuredDesigns` → `featuredItems`
2. **Update Field Names:** Change `featured_products` → `featured_items` in ACF
3. **Update Frontend Types:** Update TypeScript/JavaScript types to use new field names

### Old Query (v1.0.0)
```graphql
query {
  siteSettings {
    nodes {
      featuredDesigns {
        featuredTitle
        featuredProducts {
          nodes { ... }
        }
      }
    }
  }
}
```

### New Query (v1.1.0+)
```graphql
query {
  siteSettings {
    nodes {
      featuredItems {
        featuredTitle
        featuredItems {
          nodes { ... }
        }
      }
    }
  }
}
```

## Troubleshooting

### Featured items not showing in GraphQL

1. Ensure WPGraphQL and wpgraphql-acf plugins are installed and activated
2. Check that ACF fields have `show_in_graphql` set to `1`
3. Verify the post type `site_settings` has `show_in_graphql` enabled

### Can't select items in admin

1. Ensure ACF plugin is installed and activated
2. Check that the post type you're trying to select is public
3. Verify user has proper permissions

### Environment variables not working

1. Ensure environment variables are set before WordPress loads
2. Check that `getenv()` is available in your PHP environment
3. For Docker, ensure variables are passed to the container

## Changelog

### 1.1.0 (2025-01-29)
- **BREAKING:** Renamed GraphQL field from `featuredDesigns` to `featuredItems`
- **BREAKING:** Renamed ACF field from `featured_products` to `featured_items`
- **BREAKING:** Renamed functions from `featured_designs_*` to `gp_featured_items_*`
- Added filter hooks for customization
- Added environment variable support
- Made plugin generic (removed project-specific hardcoded values)
- Updated plugin header to be generic

### 1.0.0
- Initial release (project-specific version)

## License

This plugin is part of the headless WordPress starter project. Use as needed for your projects.

## Support

For issues or questions, please open an issue in the [headless-wordpress-starter](https://github.com/lesgreen/headless-wordpress-starter) repository.

