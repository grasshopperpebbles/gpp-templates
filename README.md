# GPP Templates

Extended templates for GPP CLI. Install these templates to expand GPP's scaffolding capabilities.

## Installation

Install all templates:
```bash
gpp template install /path/to/gpp-templates --all
```

Install specific template:
```bash
gpp template install /path/to/gpp-templates/cms/cms-only --as cms/cms-only
```

## Available Templates

### CMS
| Template | Description |
|----------|-------------|
| `cms/cms-only` | WordPress headless CMS without WooCommerce |
| `cms/cms-ecommerce` | WordPress with CMS and WooCommerce (blog primary) |
| `cms/ecommerce-only` | WordPress with WooCommerce only |
| `cms/ecommerce-cms` | WordPress with CMS and WooCommerce (shop primary) |
| `cms/strapi-only` | Strapi headless CMS |
| `cms/strapi-dev` | Strapi development instance for plugin development |

All WordPress CMS variants include bundled custom plugins in `wp-content/plugins/`:
- **gp-featured-items** — curate featured content sections (ACF relationship field + GraphQL)
- **gp-headless-config** — expose GA4, Sentry, CloudWatch, Resend settings via GraphQL
- **gp-hero-slider** — rotating hero images for blog homepages (ACF fields + GraphQL)
- **gp-most-popular** — track and expose most-viewed posts via GraphQL
- **gp-social-poster** — auto-post to social platforms on publish

Strapi variants include content model schemas for hero slides (`hero.slide` component + `homepage` single type).

### Web (Next.js Frontends)
| Template | Description |
|----------|-------------|
| `web/nextjs-headless-wp-cms` | Next.js frontend for WordPress CMS |
| `web/nextjs-headless-wp-ecommerce` | Next.js frontend for WordPress e-commerce |
| `web/nextjs-headless-wp-full` | Next.js frontend for full WordPress (CMS + e-commerce) |
| `web/nextjs-headless-strapi` | Next.js frontend for Strapi CMS |
| `web/nextjs-headless-sanity` | Next.js frontend for Sanity CMS |
| `web/nextjs-headless-storyblok` | Next.js frontend for Storyblok CMS |
| `web/nextjs-admin-dashboard` | Admin dashboard template |
| `web/nextjs-saas-dashboard` | SaaS application dashboard |
| `web/nextjs-app-landing` | Mobile app marketing landing page |
| `web/nextjs-marketing` | Marketing site template |
| `web/nextjs-landing` | Landing page template |
| `web/nextjs-webapp` | General-purpose web application |
| `web/nextjs-devtool-site` | Developer tool documentation site |

### Web (SvelteKit Frontends)
| Template | Description |
|----------|-------------|
| `web/sveltekit-headless-wp-cms` | SvelteKit frontend for WordPress CMS |
| `web/sveltekit-headless-wp-ecommerce` | SvelteKit frontend for WordPress e-commerce |
| `web/sveltekit-headless-wp-full` | SvelteKit frontend for full WordPress (CMS + e-commerce) |
| `web/sveltekit-headless-strapi` | SvelteKit frontend for Strapi CMS |
| `web/sveltekit-headless-sanity` | SvelteKit frontend for Sanity CMS |
| `web/sveltekit-headless-storyblok` | SvelteKit frontend for Storyblok CMS |
| `web/sveltekit-admin-dashboard` | SvelteKit admin dashboard |
| `web/sveltekit-saas-dashboard` | SvelteKit SaaS dashboard |
| `web/sveltekit-marketing` | SvelteKit marketing site |
| `web/sveltekit-landing` | SvelteKit landing page |
| `web/sveltekit-webapp` | SvelteKit general-purpose web application |
| `web/sveltekit-devtool-site` | SvelteKit developer tool documentation site |

All headless WordPress and Strapi web variants (both Next.js and SvelteKit) include:
- **Hero slides data fetcher** (`hero-slides.ts`) for WP GraphQL; Strapi variants also include `hero-slides-strapi.ts`
- **Hero carousel component** (`hero-carousel.tsx` for Next.js, `HeroCarousel.svelte` for SvelteKit) with auto-rotation, pause on hover/focus, `prefers-reduced-motion` support, and dot indicators

### Mobile
| Template | Description |
|----------|-------------|
| `mobile/flutter-standalone` | Flutter app without API backend |
| `mobile/flutter-api-client` | Flutter app with API integration |

### Desktop
| Template | Description |
|----------|-------------|
| `desktop/electron` | Electron desktop application |

### Worker
| Template | Description |
|----------|-------------|
| `worker/celery-python` | Python Celery background worker |

### API
| Template | Description |
|----------|-------------|
| `api/go-http` | Go REST API using stdlib (no frameworks) |
| `api/rust-axum` | Rust REST API using Axum framework |

### Python
| Template | Description |
|----------|-------------|
| `python/fastapi` | FastAPI REST API |
| `python/base` | Basic Python project |
| `python/conda-trading` | Trading algorithms with Conda |

### Add-ons
| Template | Description |
|----------|-------------|
| `add-ons/auth-flows` | Authentication flow components |

## Template Structure

Each template follows this structure:

```
template-name/
├── variant.json      # Template metadata
├── files/            # Files to copy to project
│   ├── src/
│   ├── package.json
│   └── ...
└── postInstall.json  # Optional: post-install actions
```

## Usage After Installation

Once installed, use templates with:
```bash
gpp add <platform> <variant>
```

Examples:
```bash
gpp add cms cms-only
gpp add web headless-wp-cms
gpp add mobile flutter-standalone
gpp add desktop electron
```

## Updating Templates

Update a specific template:
```bash
gpp template install /path/to/gpp-templates/cms/cms-only --as cms/cms-only --force
```

Update all templates:
```bash
gpp template install /path/to/gpp-templates --all --force
```

## Template Locations

- User-installed templates: `~/.gpp/templates/`
- Bundled templates: Inside GPP CLI package

User-installed templates take precedence over bundled templates.

## Recipes

Recipes combine multiple templates into full-stack projects.

### SaaS
| Recipe | Description |
|--------|-------------|
| `saas/nextjs-go-postgres` | Next.js dashboard + Go API + PostgreSQL |
| `saas/nextjs-fastapi-postgres` | Next.js dashboard + FastAPI + PostgreSQL |
| `saas/sveltekit-go-postgres` | SvelteKit dashboard + Go API + PostgreSQL |

### CMS
| Recipe | Description |
|--------|-------------|
| `cms/nextjs-strapi` | Next.js frontend + Strapi CMS |
| `cms/nextjs-storyblok` | Next.js frontend + Storyblok CMS |
| `cms/sveltekit-sanity` | SvelteKit frontend + Sanity CMS |
| `cms/sveltekit-storyblok` | SvelteKit frontend + Storyblok CMS |

### Landing
| Recipe | Description |
|--------|-------------|
| `landing/nextjs-static` | Static Next.js landing page |
| `landing/nextjs-strapi` | Next.js landing + Strapi CMS |
| `landing/nextjs-sanity` | Next.js landing + Sanity CMS |
| `landing/nextjs-storyblok` | Next.js landing + Storyblok CMS |

### E-commerce
| Recipe | Description |
|--------|-------------|
| `ecommerce/nextjs-woocommerce` | Next.js + WooCommerce |
| `ecommerce/nextjs-woocommerce-wordpress` | Next.js + WooCommerce + WordPress CMS |

### Usage

```bash
gpp init --recipe nextjs-go-postgres
```

## Template Variables

Templates can use placeholders that are replaced during project creation:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{PROJECT_SLUG}}` | Project name from CLI | `my-saas-app` |
| `{{PLATFORM_SLUG}}` | Workspace ID from recipe | `api`, `web` |

Essential for Go templates where module paths must match the project structure.
