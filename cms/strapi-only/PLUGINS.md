# Strapi Plugins Guide

This template includes the most common Strapi plugins pre-installed but disabled by default.

## Included Plugins

### 1. GraphQL Plugin
**Package:** `@strapi/plugin-graphql`  
**Status:** Installed, disabled by default

Adds a GraphQL endpoint to your Strapi API.

**Enable:**
```typescript
// config/plugins.ts
graphql: {
  enabled: true,
}
```

**Access:** http://localhost:1337/graphql

**Documentation:** https://docs.strapi.io/dev-docs/plugins/graphql

---

### 2. Email Plugin
**Package:** `@strapi/plugin-email`  
**Status:** Installed, disabled by default

Enables email sending functionality with support for multiple providers.

**Enable:**
```typescript
// config/plugins.ts
email: {
  enabled: true,
  config: {
    provider: 'sendgrid', // or 'nodemailer', 'amazon-ses', etc.
    providerOptions: {
      apiKey: env('SENDGRID_API_KEY'),
    },
    settings: {
      defaultFrom: 'noreply@example.com',
      defaultReplyTo: 'noreply@example.com',
    },
  },
}
```

**Supported Providers:**
- SendGrid
- AWS SES
- Nodemailer (SMTP)
- Mailgun
- And more...

**Documentation:** https://docs.strapi.io/dev-docs/plugins/email

---

### 3. Documentation Plugin
**Package:** `@strapi/plugin-documentation`  
**Status:** Installed, disabled by default

Generates interactive API documentation (OpenAPI/Swagger).

**Enable:**
```typescript
// config/plugins.ts
documentation: {
  enabled: true,
}
```

**Access:** http://localhost:1337/documentation

**Documentation:** https://docs.strapi.io/dev-docs/plugins/documentation

---

### 4. Sentry Plugin
**Package:** `@strapi/plugin-sentry`  
**Status:** Installed, disabled by default

Integrates Sentry for error tracking and monitoring.

**Enable:**
```typescript
// config/plugins.ts
sentry: {
  enabled: true,
  config: {
    dsn: env('SENTRY_DSN'),
    init: {
      environment: env('NODE_ENV', 'development'),
      tracesSampleRate: 1.0,
    },
  },
}
```

**Environment Variable:**
```bash
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

**Documentation:** https://docs.strapi.io/dev-docs/plugins/sentry

---

### 5. SEO Plugin
**Package:** `strapi-plugin-seo`  
**Status:** Installed, disabled by default

Adds SEO fields (meta title, description, OG tags) to content types for better search engine optimization.

**Enable:**
```typescript
// config/plugins.ts
seo: {
  enabled: true,
}
```

**Features:**
- Meta title and description fields
- Open Graph tags for social media
- Twitter Card support
- Canonical URLs
- Structured data

**Documentation:** https://github.com/strapi/strapi/tree/main/packages/plugins/seo

---

### 6. Sitemap Plugin
**Package:** `strapi-plugin-sitemap`  
**Status:** Installed, disabled by default

Automatically generates XML sitemaps for search engines.

**Enable:**
```typescript
// config/plugins.ts
sitemap: {
  enabled: true,
  config: {
    hostname: env('SITE_URL', 'http://localhost:1337'),
    limit: 45000,
    xsl: true,
    excludeDrafts: true,
  },
}
```

**Access:** http://localhost:1337/sitemap.xml

**Documentation:** https://github.com/boazpoolman/strapi-plugin-sitemap

---

### 7. AWS S3 Upload Provider
**Package:** `strapi-provider-upload-aws-s3`  
**Status:** Installed, not configured by default

Enables AWS S3 for media storage (production-ready alternative to local filesystem).

**Configure:**
```typescript
// config/plugins.ts
upload: {
  config: {
    provider: 'aws-s3',
    providerOptions: {
      accessKeyId: env('AWS_ACCESS_KEY_ID'),
      secretAccessKey: env('AWS_SECRET_ACCESS_KEY'),
      region: env('AWS_REGION', 'us-east-1'),
      params: {
        Bucket: env('AWS_S3_BUCKET'),
      },
    },
    actionOptions: {
      upload: {},
      uploadStream: {},
      delete: {},
    },
  },
}
```

**Environment Variables:**
```bash
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

**Documentation:** https://github.com/strapi/strapi/tree/main/packages/providers/upload-aws-s3

---

### 8. Cloudinary Upload Provider
**Package:** `strapi-provider-upload-cloudinary`  
**Status:** Installed, not configured by default

Enables Cloudinary for advanced media management with image optimization and CDN delivery.

**Configure:**
```typescript
// config/plugins.ts
upload: {
  config: {
    provider: 'cloudinary',
    providerOptions: {
      cloud_name: env('CLOUDINARY_NAME'),
      api_key: env('CLOUDINARY_KEY'),
      api_secret: env('CLOUDINARY_SECRET'),
    },
    actionOptions: {
      upload: {},
      uploadStream: {},
      delete: {},
    },
  },
}
```

**Environment Variables:**
```bash
CLOUDINARY_NAME=your-cloud-name
CLOUDINARY_KEY=your-api-key
CLOUDINARY_SECRET=your-api-secret
```

**Features:**
- Automatic image optimization
- CDN delivery
- Image transformations
- Video support

**Documentation:** https://github.com/strapi/strapi/tree/main/packages/providers/upload-cloudinary

---

### 9. CKEditor 5 Plugin
**Package:** `strapi-plugin-ckeditor5`  
**Status:** Installed, **enabled by default**

Enhanced rich text editor that replaces Strapi's default editor with CKEditor 5, providing advanced formatting options and better user experience.

**Features:**
- Advanced formatting (headings, lists, quotes, tables)
- Media embedding
- Link management
- Undo/redo
- Customizable toolbar
- Better mobile experience

**Configuration:**
The plugin is enabled by default with a production-ready toolbar configuration. Customize in `config/plugins.ts`:

```typescript
// config/plugins.ts
ckeditor: {
  enabled: true,
  config: {
    editor: {
      toolbar: {
        items: [
          'heading',
          '|',
          'bold',
          'italic',
          'link',
          'bulletedList',
          'numberedList',
          // ... add more items as needed
        ],
      },
    },
  },
}
```

**Documentation:** https://github.com/Roslovets-Inc/strapi-plugin-ckeditor5

---

### 10. Navigation Plugin
**Package:** `strapi-plugin-navigation`  
**Status:** Installed, disabled by default

Manages site navigation menus (header, footer, mobile) with support for internal links, external URLs, and nested structures.

**Enable:**
```typescript
// config/plugins.ts
navigation: {
  enabled: true,
  config: {
    contentTypes: ['api::page.page', 'api::article.article'],
    contentTypesNameFields: {
      'api::page.page': ['title'],
      'api::article.article': ['title'],
    },
    allowedLevels: 2,
  },
}
```

**Features:**
- Multiple navigation trees (header, footer, mobile)
- Internal and external links
- Nested menu structures
- GraphQL and REST API support
- TypeScript support

**Access:** Available in Admin Panel → Navigation

**Documentation:** https://github.com/VirtusLab-Open-Source/strapi-plugin-navigation

---

### 11. Comments Plugin
**Package:** `strapi-plugin-comments`  
**Status:** Installed, disabled by default

Advanced content moderation system for comments with spam filtering, approval workflows, and audit trails.

**Enable:**
```typescript
// config/plugins.ts
comments: {
  enabled: true,
  config: {
    enabledCollections: ['api::article.article'],
    badWords: false,
    moderatorRoles: ['Authenticated'],
    approvalFlow: ['api::article.article'],
  },
}
```

**Features:**
- Guest and authenticated commenting
- Moderation workflow (pending, approved, blocked)
- Profanity filtering
- Akismet spam integration
- Webhook notifications
- Audit logs for compliance

**Documentation:** https://github.com/VirtusLab-Open-Source/strapi-plugin-comments

---

### 12. Config Sync Plugin
**Package:** `strapi-plugin-config-sync`  
**Status:** Installed, disabled by default

Syncs roles, permissions, content type schemas, and extension settings across environments via git-tracked files.

**Enable:**
```typescript
// config/plugins.ts
'config-sync': {
  enabled: true,
  config: {
    syncDir: 'config/sync',
    minify: false,
    soft: false,
    importOnBootstrap: false,
  },
}
```

**Usage:**
```bash
# Export current config
yarn strapi config:sync

# Apply to another environment
yarn strapi config:pull
```

**Features:**
- Version-controlled configuration
- CI/CD integration
- Disaster recovery
- Multi-environment sync
- Prevents rogue production changes

**Documentation:** https://github.com/strapi/strapi/tree/main/packages/plugins/config-sync

---

### 13. Import Export Plugin
**Package:** `strapi-plugin-import-export-entries`  
**Status:** Installed, disabled by default

Enterprise data management for bulk imports/exports via CSV or JSON with support for relations and dynamic zones.

**Enable:**
```typescript
// config/plugins.ts
'import-export-entries': {
  enabled: true,
}
```

**Features:**
- CSV and JSON import/export
- Field mapping wizard
- Preview transformations
- Upsert or create options
- Handles relations and dynamic zones
- Checksum verification for compliance

**Access:** Available in Admin Panel for each content type

**Documentation:** https://github.com/strapi/strapi/tree/main/packages/plugins/import-export-entries

---

## Core Plugins (Always Enabled)

These plugins are core to Strapi and are enabled by default:

- **Users & Permissions** - Authentication and authorization
- **Internationalization (i18n)** - Multi-language content support
- **Upload** - Media library (built-in, uses local filesystem by default)
- **CKEditor 5** - Enhanced rich text editor (enabled by default)

---

## Installing Additional Plugins

To install additional community plugins:

```bash
# Inside Strapi container
docker compose exec strapi yarn add strapi-plugin-<name>

# Or using npm
docker compose exec strapi npm install strapi-plugin-<name>
```

Then configure in `config/plugins.ts`:

```typescript
export default ({ env }) => ({
  'plugin-name': {
    enabled: true,
    config: {
      // Plugin configuration
    },
  },
});
```

---

## Plugin Configuration File

All plugin configurations are in `config/plugins.ts`. This file is created during setup with all plugins disabled by default. Enable plugins as needed by setting `enabled: true` and configuring their options.

**Note:** After enabling/disabling plugins, restart Strapi:
```bash
docker compose restart strapi
```

