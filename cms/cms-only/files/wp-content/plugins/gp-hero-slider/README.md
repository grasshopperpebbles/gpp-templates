# GP Hero Slider

Rotating hero images for blog site homepages. Uses ACF custom fields and exposes data via WPGraphQL.

## Requirements

- WordPress 6.0+
- Advanced Custom Fields (ACF)
- WPGraphQL

## Usage

1. Navigate to **Hero Slides** in the WordPress admin sidebar.
2. Add slides with a title, featured image, optional subtitle, and optional CTA link.
3. Set the **Sort Order** to control display sequence (lower numbers first).

## GraphQL Query

```graphql
query GetHeroSlides {
  heroSlides(first: 10, where: { orderby: { field: MENU_ORDER, order: ASC } }) {
    nodes {
      title
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
      heroSlideFields {
        heroSubtitle
        heroLinkUrl
        heroLinkText
        heroSortOrder
      }
    }
  }
}
```
