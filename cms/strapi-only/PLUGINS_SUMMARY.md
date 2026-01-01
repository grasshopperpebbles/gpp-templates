# Strapi Plugins - Installation Summary

## Overview

The Strapi template now includes the most common Strapi plugins **pre-installed but disabled by default**. This allows developers to enable plugins as needed without manual installation.

## Included Plugins

| Plugin | Package | Status | Purpose |
|--------|---------|--------|---------|
| **CKEditor 5** | `strapi-plugin-ckeditor5` | **Enabled** | Enhanced rich text editor (default) |
| GraphQL | `@strapi/plugin-graphql` | Disabled | GraphQL API endpoint |
| Email | `@strapi/plugin-email` | Disabled | Email sending functionality |
| Documentation | `@strapi/plugin-documentation` | Disabled | API documentation (OpenAPI/Swagger) |
| Sentry | `@strapi/plugin-sentry` | Disabled | Error tracking and monitoring |
| SEO | `strapi-plugin-seo` | Disabled | SEO fields for content types |
| Sitemap | `strapi-plugin-sitemap` | Disabled | XML sitemap generation |
| Navigation | `strapi-plugin-navigation` | Disabled | Site navigation management |
| Comments | `strapi-plugin-comments` | Disabled | Content moderation system |
| Config Sync | `strapi-plugin-config-sync` | Disabled | Environment configuration sync |
| Import Export | `strapi-plugin-import-export-entries` | Disabled | Bulk data import/export |
| AWS S3 Provider | `strapi-provider-upload-aws-s3` | Installed | Cloud storage for media (AWS S3) |
| Cloudinary Provider | `strapi-provider-upload-cloudinary` | Installed | Cloud storage for media (Cloudinary) |

## Core Plugins (Always Enabled)

- **Users & Permissions** - Authentication and authorization
- **Internationalization (i18n)** - Multi-language content support
- **Upload** - Media library (built-in)

## Configuration

All plugins are configured in `config/plugins.ts`:

```typescript
export default ({ env }) => ({
  graphql: {
    enabled: false, // Change to true to enable
  },
  email: {
    enabled: false, // Change to true to enable
  },
  documentation: {
    enabled: false, // Change to true to enable
  },
  sentry: {
    enabled: false, // Change to true to enable
  },
});
```

## Enabling Plugins

1. Edit `config/plugins.ts`
2. Set `enabled: true` for desired plugins
3. Configure plugin-specific options
4. Restart Strapi: `docker compose restart strapi`

## Benefits

- **Faster Setup:** No need to manually install common plugins
- **Consistent Environment:** All projects start with the same plugin set
- **Easy Activation:** Simply enable in config file
- **Production Ready:** Plugins are tested and configured

## Documentation

See `PLUGINS.md` for detailed documentation on each plugin, including:
- Configuration options
- Environment variables
- Usage examples
- Links to official documentation

