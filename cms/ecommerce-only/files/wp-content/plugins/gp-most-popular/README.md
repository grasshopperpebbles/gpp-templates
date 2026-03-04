# GP Most Popular Plugin

A generic WordPress plugin for managing most popular content sections on the homepage using Advanced Custom Fields (ACF). Works with any content type (posts, products, pages, custom post types) and includes smart fallback to best-sellers for WooCommerce sites.

## Features

- ✅ **Generic & Flexible:** Works with any post type (posts, products, pages, custom post types)
- ✅ **ACF Integration:** Uses Advanced Custom Fields for easy content management
- ✅ **WPGraphQL Support:** Exposes all fields via GraphQL for headless frontends
- ✅ **Smart Fallback:** Automatically fills empty slots with best-sellers (WooCommerce only, optional)
- ✅ **Configurable:** Customize defaults via WordPress filters or environment variables
- ✅ **Admin-Friendly:** Simple WordPress admin interface for managing popular content

## Installation

1. Copy the `gp-most-popular` folder to your WordPress `wp-content/plugins/` directory
2. Activate the plugin in WordPress Admin → Plugins
3. A default "Popular Settings" post will be created automatically

## Configuration

### Method 1: WordPress Filters (Recommended for themes/plugins)

Add to your theme's `functions.php` or a custom plugin:

```php
// Customize default title
add_filter('gp_most_popular_default_title', function() {
    return 'Trending Now';
});

// Customize default description
add_filter('gp_most_popular_default_description', function() {
    return 'See what others are loving';
});

// Customize maximum items
add_filter('gp_most_popular_max_items', function() {
    return 6; // Default is 4
});

// Customize menu label
add_filter('gp_most_popular_menu_label', function() {
    return 'Trending Content';
});

// Disable best-sellers fallback (for non-WooCommerce sites)
add_filter('gp_most_popular_enable_best_sellers_fallback', function() {
    return false;
});
```

### Method 2: Environment Variables (For headless setups)

Add to your `.env` file or Docker environment:

```bash
GP_MOST_POPULAR_TITLE="Trending Now"
GP_MOST_POPULAR_DESCRIPTION="See what others are loving"
GP_MOST_POPULAR_MAX=6
GP_MOST_POPULAR_MENU_LABEL="Trending Content"
GP_MOST_POPULAR_ENABLE_BEST_SELLERS=false
```

## Usage

### WordPress Admin

1. Navigate to **Most Popular** (or your custom menu label) in WordPress Admin
2. Edit the "Popular Settings" post
3. Fill in:
   - **Section Title:** The heading for your popular section
   - **Section Description:** Optional description text
   - **Popular Content:** Select up to 4 items (or your custom max) from any post type
4. Save the post

**Note:** If you select fewer items than the maximum, and best-sellers fallback is enabled, the plugin will automatically fill remaining slots with best-selling products (WooCommerce only).

### GraphQL Query

Query popular items from your headless frontend:

```graphql
query GetMostPopular {
  popularSettings(first: 1) {
    nodes {
      id
      databaseId
      title
      mostPopular {
        popularTitle
        popularDescription
        popularItemsResolved {
          ... on Product {
            id
            databaseId
            name
            slug
            price
            image {
              sourceUrl
              altText
            }
          }
          ... on Post {
            id
            databaseId
            title
            slug
            excerpt
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
```

### TypeScript Example

```typescript
import { gql } from '@apollo/client';

const GET_MOST_POPULAR = gql`
  query GetMostPopular {
    popularSettings(first: 1) {
      nodes {
        mostPopular {
          popularTitle
          popularDescription
          popularItemsResolved {
            ... on Product {
              id
              name
              slug
            }
          }
        }
      }
    }
  }
`;

// Use in your component
const { data, loading, error } = useQuery(GET_MOST_POPULAR);
```

## Smart Fallback Feature

The plugin includes a smart fallback feature that automatically fills empty slots with best-selling products (WooCommerce only). This feature:

- **Only works with WooCommerce:** Checks if WooCommerce is active
- **Respects manual selections:** Never replaces manually selected items
- **Fills empty slots:** Only fills slots that weren't manually selected
- **Configurable:** Can be disabled via filter or environment variable

**Example:**
- Maximum items: 4
- Manually selected: 2 items
- Plugin automatically adds: 2 best-selling products

## GraphQL Schema

The plugin exposes the following GraphQL types:

### PopularSetting

```graphql
type PopularSetting {
  id: ID!
  databaseId: Int!
  title: String!
  mostPopular: MostPopular_Fields
}
```

### MostPopular_Fields

```graphql
type MostPopular_Fields {
  popularTitle: String
  popularDescription: String
  popularItems: [Node]  # Manually selected items
  popularItemsResolved: [Product]  # Manual + best-sellers (if enabled)
}
```

## Customization Examples

### E-commerce Site (WooCommerce)

```php
add_filter('gp_most_popular_default_title', function() {
    return 'Best Sellers';
});

add_filter('gp_most_popular_default_description', function() {
    return 'Shop our top-selling products';
});

add_filter('gp_most_popular_max_items', function() {
    return 8;
});

// Best-sellers fallback enabled by default
```

### Blog Site (No WooCommerce)

```php
add_filter('gp_most_popular_default_title', function() {
    return 'Trending Articles';
});

add_filter('gp_most_popular_default_description', function() {
    return 'Our most-read posts this week';
});

// Disable best-sellers fallback (not applicable)
add_filter('gp_most_popular_enable_best_sellers_fallback', function() {
    return false;
});
```

### Portfolio Site

```php
add_filter('gp_most_popular_default_title', function() {
    return 'Featured Work';
});

add_filter('gp_most_popular_default_description', function() {
    return 'Selected projects from our portfolio';
});

add_filter('gp_most_popular_enable_best_sellers_fallback', function() {
    return false;
});
```

## Requirements

- WordPress 6.0+
- PHP 7.4+
- Advanced Custom Fields (ACF) plugin
- WPGraphQL plugin
- wpgraphql-acf plugin (for ACF GraphQL support)
- WooCommerce (optional, for best-sellers fallback feature)

## Migration from Old Version

If you're upgrading from v1.0.0:

1. **Update GraphQL Queries:** Change `popularProductsResolved` → `popularItemsResolved`
2. **Update Field Names:** Change `popular_products` → `popular_items` in ACF
3. **Update Frontend Types:** Update TypeScript/JavaScript types to use new field names

### Old Query (v1.0.0)
```graphql
query {
  popularSettings {
    nodes {
      mostPopular {
        popularTitle
        popularProductsResolved { ... }
      }
    }
  }
}
```

### New Query (v1.1.0+)
```graphql
query {
  popularSettings {
    nodes {
      mostPopular {
        popularTitle
        popularItemsResolved { ... }
      }
    }
  }
}
```

## Troubleshooting

### Popular items not showing in GraphQL

1. Ensure WPGraphQL and wpgraphql-acf plugins are installed and activated
2. Check that ACF fields have `show_in_graphql` set to `1`
3. Verify the post type `popular_settings` has `show_in_graphql` enabled

### Best-sellers fallback not working

1. Ensure WooCommerce is installed and activated
2. Check that `GP_MOST_POPULAR_ENABLE_BEST_SELLERS_FALLBACK` is `true`
3. Verify products have `total_sales` meta data (WooCommerce tracks this automatically)

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
- **BREAKING:** Renamed GraphQL field from `popularProductsResolved` to `popularItemsResolved`
- **BREAKING:** Renamed ACF field from `popular_products` to `popular_items`
- **BREAKING:** Renamed functions from `mpp_*` to `gp_most_popular_*`
- Added filter hooks for customization
- Added environment variable support
- Made plugin generic (removed project-specific hardcoded values)
- Updated plugin header to be generic
- Made best-sellers fallback optional and configurable
- Added WooCommerce check before using best-sellers feature

### 1.0.0
- Initial release (project-specific version)

## License

This plugin is part of the headless WordPress starter project. Use as needed for your projects.

## Support

For issues or questions, please open an issue in the [headless-wordpress-starter](https://github.com/lesgreen/headless-wordpress-starter) repository.

