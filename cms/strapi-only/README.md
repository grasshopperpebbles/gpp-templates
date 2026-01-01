# Strapi CMS Template

This template provides a complete Strapi headless CMS setup with Docker, MySQL, and phpMyAdmin.

## Features

- **Strapi 5.x** - Modern headless CMS with TypeScript and Vite
- **MySQL 8.0** - Database backend
- **phpMyAdmin** - Database management interface
- **GraphQL Support** - GraphQL plugin included (disabled by default)
- **REST API** - Built-in REST API
- **Docker Compose** - Easy container orchestration
- **CKEditor 5** - Enhanced rich text editor (enabled by default)
- **Production Plugins Pre-installed** - GraphQL, Email, Documentation, Sentry, SEO, Sitemap (disabled by default)
- **Cloud Storage Providers** - AWS S3 and Cloudinary upload providers (installed, not configured)

## Setup

1. Add the CMS platform with Strapi variant:
   ```bash
   gpp add cms strapi-only
   ```

2. Run the Strapi setup:
   ```bash
   gpp strapi setup
   ```

3. Access Strapi Admin:
   - Admin Panel: http://localhost:1337/admin
   - API: http://localhost:1337/api
   - GraphQL: http://localhost:1337/graphql (after installing plugin)

## Configuration

The setup creates:
- `.env` - Environment variables for Strapi and Docker
- `docker-compose.yml` - Docker services configuration
- `package.json` - Strapi dependencies
- `Dockerfile` - Strapi container image
- `config/` - Strapi configuration files

## Included Plugins

The following production-ready plugins are pre-installed but **disabled by default**. Enable them in `config/plugins.ts`:

### Official Strapi Plugins
- **GraphQL** (`@strapi/plugin-graphql`) - GraphQL API endpoint
- **Email** (`@strapi/plugin-email`) - Email sending functionality
- **Documentation** (`@strapi/plugin-documentation`) - API documentation generator
- **Sentry** (`@strapi/plugin-sentry`) - Error tracking and monitoring

### Community Plugins (Production-Ready)
- **CKEditor 5** (`strapi-plugin-ckeditor5`) - Enhanced rich text editor (**enabled by default**)
- **SEO** (`strapi-plugin-seo`) - SEO fields (meta tags, OG tags) for content types
- **Sitemap** (`strapi-plugin-sitemap`) - Automatic XML sitemap generation
- **Navigation** (`strapi-plugin-navigation`) - Site navigation menu management
- **Comments** (`strapi-plugin-comments`) - Advanced content moderation system
- **Config Sync** (`strapi-plugin-config-sync`) - Sync configuration across environments
- **Import Export** (`strapi-plugin-import-export-entries`) - Enterprise data management

### Cloud Storage Providers
- **AWS S3** (`strapi-provider-upload-aws-s3`) - Production media storage
- **Cloudinary** (`strapi-provider-upload-cloudinary`) - Advanced media management with CDN

### Enabling Plugins

Edit `config/plugins.ts` and set `enabled: true` for the plugins you want to use:

```typescript
export default ({ env }) => ({
  graphql: {
    enabled: true, // Enable GraphQL
  },
  email: {
    enabled: true, // Enable email
    config: {
      provider: 'sendgrid',
      providerOptions: {
        apiKey: env('SENDGRID_API_KEY'),
      },
    },
  },
  // ... other plugins
});
```

## Next Steps

1. **Enable Plugins** (optional):
   - Edit `config/plugins.ts` to enable desired plugins
   - Restart Strapi: `docker compose restart strapi`

2. **Create Content Types**:
   - Visit http://localhost:1337/admin
   - Use the Content-Type Builder to create your content types
   - Configure fields, relations, and permissions

3. **Connect Next.js Frontend**:
   - The `headless-strapi` Next.js variant is automatically added
   - Configure API endpoints in `.env.local`

## Environment Variables

Key environment variables in `.env`:
- `STRAPI_PORT` - Strapi server port (default: 1337)
- `MYSQL_DATABASE` - Database name
- `MYSQL_USER` - Database user
- `MYSQL_PASSWORD` - Database password
- `ADMIN_EMAIL` - Admin user email
- `ADMIN_PASSWORD` - Admin user password

## Development

Start development environment:
```bash
./dev.sh
```

Or manually:
```bash
docker compose --env-file .env up -d
```

View logs:
```bash
docker compose logs -f strapi
```

## Database Management

Access phpMyAdmin at http://localhost:9091 (or configured port)

Default credentials:
- Server: `db`
- Username: `root`
- Password: (from `.env` `MYSQL_ROOT_PASSWORD`)

## GraphQL

To enable GraphQL:

1. Install the plugin:
   ```bash
   docker compose exec strapi yarn strapi install graphql
   ```

2. Restart Strapi:
   ```bash
   docker compose restart strapi
   ```

3. Access GraphQL playground at http://localhost:1337/graphql

## API Authentication

Strapi uses JWT tokens for API authentication. To use authenticated requests:

1. Get a token from the admin panel or via API
2. Set `STRAPI_API_TOKEN` in your Next.js `.env.local`
3. The token will be used automatically by the Strapi client

## Troubleshooting

**Strapi won't start:**
- Check Docker logs: `docker compose logs strapi`
- Verify database is running: `docker compose ps`
- Check environment variables in `.env`

**Database connection errors:**
- Ensure MySQL container is running: `docker compose ps db`
- Verify database credentials in `.env`
- Check MySQL logs: `docker compose logs db`

**Port conflicts:**
- Change ports in `.env` if conflicts occur
- Default ports: Strapi (1337), MySQL (3307), phpMyAdmin (9091)

