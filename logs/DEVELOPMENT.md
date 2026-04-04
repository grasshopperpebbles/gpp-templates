
---

## Session: Docker container naming conventions (2026-04-04)

**Date:** 2026-04-04
**Focus:** Add `container_name` to backend docker-compose templates that were missing it.

### Context

Five backend templates had no `container_name` set in their docker-compose.yml files. This caused Docker Desktop to show bare generic names (`redis`, `db`) that are indistinguishable across projects. The CMS and Strapi templates already used `${PROJECT_SLUG:-default}-service` naming — these five did not.

### What changed

- Added `container_name: ${PROJECT_SLUG:-<default>}-<service>` to all active and commented-out services in:
  - `python/fastapi` (db, api, redis)
  - `api/go-http` (api, db)
  - `api/rust-axum` (api, db)
  - `worker/celery-python` (redis, worker, beat, flower)
  - `worker/rust-tokio` (worker, redis)

### Result

All backend templates now produce project-prefixed container names in Docker Desktop (e.g. `myproject-db`, `myproject-api` instead of bare `db`, `api`).

---

## Session: SaaS dashboard feature flags and route group layout (2026-04-04)

**Date:** 2026-04-04
**Focus:** Make team management and billing opt-in via feature flags in the `nextjs-saas-dashboard` template.

### Context

The `nextjs-saas-dashboard` template baked in multi-tenant features (team management, billing, RBAC) that are unnecessary for single-creator use cases. These features added ~30% code weight to the default experience.

### What changed

- Added `teams` and `billing` feature flags to `config.ts` (pattern matches existing `auth`, `api`, etc. flags)
- Added `NEXT_PUBLIC_ENABLE_TEAMS=false` and `NEXT_PUBLIC_ENABLE_BILLING=false` to `env.example.txt`
- Created `(dashboard)` route group with shared layout that handles auth guards and sidebar navigation
- Admin pages (team, billing) gate on their respective feature flags — redirect to `/dashboard` when off
- Sidebar conditionally shows admin group items based on feature flags
- Auth boilerplate removed from individual pages (layout handles it)
- Updated `variant.json` with `optIn` features and routes sections

### Result

Template is lighter by default. `gpp add web nextjs-saas-dashboard` scaffolds a dashboard with auth, data tables, settings — no team/billing unless opted in. Bundled into gpp-cli.

---

## Session: Added video platform with remotion variant (2026-04-02)

**Date:** 2026-04-02
**Focus:** Create a new `video` platform template for programmatic video generation using Remotion.

### Context

GPP CLI added a new `video` platform type (8th platform) to support Remotion-based video generation projects. The gpp-templates repo needed a corresponding `video/remotion` template with the full project structure.

### What was created

- **`video/remotion/`** — New platform template directory with `variant.json` and complete `files/` tree
- **Remotion project structure** — `Root.tsx` entry point, `CountryComparison` starter composition with spring animations, shared types
- **Multi-channel support** — `channels/` directory with example config (branding, fonts, tags, description templates)
- **YouTube channel analyzer** — Claude Code skill that fetches top videos from any YouTube channel via yt-dlp, analyzes transcripts/metadata, and produces an analysis report + reusable SOP
- **`gpp/gpp-ai.json`** — Updated to register the `video` platform with `remotion` variant

### First use case

TubeKast (tubekast.com) — a multi-channel faceless YouTube video factory. Scaffolded via `gpp add video remotion` in the tubekast project. Produces data visualization videos (country comparisons, rankings) at scale using Remotion + Claude Code.

---

## Session: Sync hero slider from gpp-cli (2026-03-04)

**Date:** 2026-03-04
**Focus:** Sync new hero slider files from gpp-cli to gpp-templates web and CMS variants.

### Context

gpp-cli added a rotating hero images feature for blog site homepages: a WordPress plugin (`gp-hero-slider`), Strapi content model, dual data fetchers (WP GraphQL + Strapi REST), and a shared `hero-carousel.tsx` component. The gpp-templates repo needed the frontend and Strapi schema files synced to the appropriate variant directories.

### What was synced

- **`hero-slides.ts` + `hero-carousel.tsx`** → 4 web variants: nextjs-headless-wp-cms, wp-ecommerce, wp-full, and nextjs-headless-strapi
- **`hero-slides-strapi.ts`** → nextjs-headless-strapi only (Strapi REST API fetcher)
- **Strapi schemas** (`hero/slide.json` component + `homepage/schema.json` single type) → cms/strapi-dev

### Additional sync (same session)

- **WP plugin (`gp-hero-slider`)** — Copied to all 4 CMS variants (cms-only, cms-ecommerce, ecommerce-cms, ecommerce-only) under `files/wp-content/plugins/gp-hero-slider/`.
- **SvelteKit variants** — Created `hero-slides.ts` (WP data fetcher using `graphqlClient`) and `HeroCarousel.svelte` (Svelte 5 component with `$state`/`$effect` runes) for all 4 SvelteKit headless-wp variants. Created `hero-slides-strapi.ts` for sveltekit-headless-strapi using `config.strapiUrl`. Svelte component uses inline SVG chevrons instead of lucide-react, and native `<img>` instead of Next.js `Image`.

---

## Session: gpp-cli GitHub repo rename (2026-02-27)

**Date:** 2026-02-27
**Focus:** Rename gpp-cli GitHub repo from `gpp` to `gpp-cli`

### Problem

The gpp-cli GitHub repository was named `grasshopperpebbles/gpp` instead of `grasshopperpebbles/gpp-cli`. This didn't match the package name or local folder, and caused the repo to not appear on GitHub.

### Fix

Renamed the repo to `grasshopperpebbles/gpp-cli` via GitHub settings and updated the local git remote URL.

### Future

Rename `gpp-templates` to `gpp-cli-templates` for consistency.

---

## Session: Fix useSearchParams Suspense boundaries (2026-02-26)

**Date:** 2026-02-26
**Focus:** Wrap `useSearchParams()` in Suspense boundaries in all verify-email templates

### Problem

Next.js requires `useSearchParams()` to be wrapped in a `<Suspense>` boundary when used in client components that are page exports. All 5 verify-email templates (auth-flows add-on + 4 platform variants) called `useSearchParams()` directly without Suspense, causing build failures.

### Fix

Split each verify-email page into an inner `VerifyEmailContent` component (which calls `useSearchParams()`) and an outer `VerifyEmailPage` export that wraps it in `<Suspense>` with a loading spinner fallback.

### Files changed
- `add-ons/auth-flows/web/src/app/(auth)/verify-email/page.tsx`
- `web/nextjs-headless-wp-full/files/src/app/verify-email/page.tsx`
- `web/nextjs-headless-wp-ecommerce/files/src/app/verify-email/page.tsx`
- `web/nextjs-headless-wp-cms/files/src/app/verify-email/page.tsx`
- `web/nextjs-headless-strapi/files/src/app/verify-email/page.tsx`

---

## Session: Full template sync from gpp-cli (2026-02-25)

**Date:** 2026-02-25
**Focus:** Sync all templates from gpp-cli into gpp-templates so both repos have a complete, consistent set

### Overview

gpp-templates is the extended template repository for GPP (used by `gpp template install` and recipes). It already had many platform variants (web, cms, desktop, worker, etc.) and add-ons/auth-flows, but was missing the rest of the add-ons and several platform templates that exist in gpp-cli. This session copied everything from gpp-cli into gpp-templates so the two repositories are aligned.

### What was added (gpp-cli → gpp-templates)

| Category | Added |
|----------|--------|
| **Add-ons** | app-landing, appstore-content, firebase, npm-package, rate-limit, redis-cache, search, strapi-plugin, supabase |
| **auth-flows** | web, api-express, api-fastapi overwritten from gpp-cli; desktop-tauri kept (gpp-templates-only) |
| **API** | api/express, api/fastapi |
| **Web** | web/nextjs-webapp, web/nextjs-devtool-site |
| **Mobile** | mobile/expo |
| **Shared** | gpp/ (gpp-ai.md, gpp-ai.json, CONVENTIONS.md), logs/ (logging system template) |

### Design decisions

- **auth-flows:** Only web, api-express, api-fastapi were replaced from gpp-cli; desktop-tauri in gpp-templates was preserved.
- **Pre-existing edits:** api/go-http, api/rust-axum, and python/fastapi had local cache-related changes; they were not overwritten.
- **logs/ in gpp-templates:** Contains both the logging system template (for projects) and this repo’s project logs (CHANGELOG, DEVELOPMENT, TODO, STRATEGY_NOTES).

### Outcome

gpp-templates now has the full add-on set and all platform variants. Commit and push these changes to complete the sync. GPP logs in gpp-cli were updated to document the sync; this file and the other gpp-templates logs document it from the templates repo side.

---
