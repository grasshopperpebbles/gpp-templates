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

### Web (Next.js Frontends)
| Template | Description |
|----------|-------------|
| `web/headless-wp-cms` | Next.js frontend for WordPress CMS |
| `web/headless-wp-ecommerce` | Next.js frontend for WordPress e-commerce |
| `web/headless-wp-full` | Next.js frontend for full WordPress (CMS + e-commerce) |
| `web/headless-strapi` | Next.js frontend for Strapi CMS |
| `web/admin-dashboard` | Admin dashboard template |
| `web/saas-dashboard` | SaaS application dashboard |
| `web/marketing` | Marketing site template |
| `web/landing` | Landing page template |

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
