# CMS Only Template

This template provides a headless WordPress setup with **CMS/blog features only** - no WooCommerce or e-commerce functionality.

## What's Included

### WordPress Backend (`apps/cms/`)
- WordPress 6.x with PHP 8.3
- Docker Compose setup (WordPress, MariaDB, Redis, phpMyAdmin)
- CMS-only plugins (no WooCommerce)
- Custom plugins: gp-featured-items, gp-most-popular, gp-social-poster, gp-headless-config

### Next.js Frontend (`apps/web/`)
- Next.js 15 with App Router
- TypeScript, Tailwind CSS, shadcn/ui
- CMS routes only: `/blog`, `/article`, `/articles`
- GraphQL client for posts
- Auth for content management
- **Automatically included** when you run `gpp add cms cms-only`

## Usage

```bash
gpp add cms cms-only
```

This creates:
- `apps/cms/` - WordPress backend (CMS-only)
- `apps/web/` - Next.js frontend (headless-wp-cms variant)

## Homepage

The homepage will be configured for blog/content display using `CMSOnlyHomepage` component.

## Environment Variables

Set `ENABLE_WOOCOMMERCE=false` (or omit it) in `apps/cms/.env` to ensure no WooCommerce plugins are installed.
