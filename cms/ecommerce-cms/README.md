# E-commerce + CMS Template (E-commerce Primary)

This template provides a headless WordPress setup with **both CMS and WooCommerce features**. E-commerce is the primary focus, with the homepage showing products.

## What's Included

### WordPress Backend (`apps/cms/`)
- WordPress 6.x with PHP 8.3
- Docker Compose setup
- **All plugins**: CMS plugins + WooCommerce plugins
- All custom plugins: gp-featured-items, gp-most-popular, gp-social-poster, gp-headless-config

### Next.js Frontend (`apps/web/`)
- Next.js 15 with App Router
- TypeScript, Tailwind CSS, shadcn/ui
- **All routes**: Blog + Products + Cart + Checkout + My Account
- Full GraphQL client (posts + products)
- WooCommerce API client
- Stripe integration
- **Automatically included** when you run `gpp add cms ecommerce-cms`

## Usage

```bash
gpp add cms ecommerce-cms
```

This creates:
- `apps/cms/` - WordPress backend (Full)
- `apps/web/` - Next.js frontend (headless-wp-full variant)

## Homepage

The homepage will be configured for **product showcase** (e-commerce primary) using `EcommerceCMSHomepage` component.

## Environment Variables

Set `ENABLE_WOOCOMMERCE=true` in `apps/cms/.env` to install WooCommerce plugins.
