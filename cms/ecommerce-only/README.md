# E-commerce Only Template

This template provides a headless WordPress setup with **WooCommerce e-commerce features only** - no blog/CMS content features.

## What's Included

### WordPress Backend (`apps/cms/`)
- WordPress 6.x with PHP 8.3
- Docker Compose setup (WordPress, MariaDB, Redis, phpMyAdmin)
- WooCommerce and all e-commerce plugins
- Custom plugins: gp-headless-config (no CMS plugins)

### Next.js Frontend (`apps/web/`)
- Next.js 15 with App Router
- TypeScript, Tailwind CSS, shadcn/ui
- E-commerce routes only: `/products`, `/cart`, `/checkout`, `/my-account`
- WooCommerce API client
- Stripe integration
- Cart and order management
- **Automatically included** when you run `gpp add cms ecommerce-only`

## Usage

```bash
gpp add cms ecommerce-only
```

This creates:
- `apps/cms/` - WordPress backend (E-commerce-only)
- `apps/web/` - Next.js frontend (headless-wp-ecommerce variant)

## Homepage

The homepage will be configured for product showcase using `EcommerceOnlyHomepage` component.

## Environment Variables

Set `ENABLE_WOOCOMMERCE=true` in `apps/cms/.env` to install WooCommerce plugins.
