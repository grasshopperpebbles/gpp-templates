
---

## [Unreleased] - 2026-04-06 - Align FastAPI recipes with current GPP init behavior

**Status:** COMPLETED

Updated the FastAPI-backed recipes so they match the current GPP adapter and template naming:

### Files modified
- `recipes/saas/nextjs-fastapi-postgres.yaml`
  - changed `pack: python/fastapi` to `pack: api/fastapi`
  - changed adapter ID from `nextjs-to-fastapi` to `next_to_fastapi`
- `recipes/mobile/flutter-fastapi.yaml`
  - changed `pack: python/fastapi` to `pack: api/fastapi`

### Rationale
- recipe IDs and pack references must match the active adapter registry and bundled template namespace
- keeping `gpp-templates` aligned with `gpp-cli` prevents recipe-init drift between the two repos

## [Unreleased] - 2026-04-04 - Add container_name to backend docker-compose templates

**Status:** COMPLETED

Added `container_name` using `${PROJECT_SLUG}` prefix to all backend templates that were missing it. Without explicit container names, Docker Desktop shows bare generic names like `redis`, `db`, `phpmyadmin` — impossible to distinguish across projects.

### Files modified
- `python/fastapi/files/docker-compose.yml` — Added container_name to db, api, redis services
- `api/go-http/files/docker-compose.yml` — Added container_name to api, db services
- `api/rust-axum/files/docker-compose.yml` — Added container_name to api, db services
- `worker/celery-python/files/docker-compose.yml` — Added container_name to redis, worker, beat, flower services
- `worker/rust-tokio/files/docker-compose.yml` — Added container_name to worker, redis services

---

## [Unreleased] - 2026-04-04 - SaaS dashboard: feature-flagged team/billing

**Status:** COMPLETED

Added feature flags to the `nextjs-saas-dashboard` template so team management and billing are opt-in (off by default). Restructured authenticated pages into a `(dashboard)` route group with a shared layout that handles auth guards and sidebar navigation.

### Files modified
- `web/nextjs-saas-dashboard/files/src/lib/config.ts` — Added `teams` and `billing` feature flags
- `web/nextjs-saas-dashboard/files/env.example.txt` — Added `NEXT_PUBLIC_ENABLE_TEAMS=false` and `NEXT_PUBLIC_ENABLE_BILLING=false`
- `web/nextjs-saas-dashboard/files/src/app/(dashboard)/layout.tsx` — New route group layout with auth guard and conditional sidebar nav
- `web/nextjs-saas-dashboard/files/src/app/(dashboard)/admin/team/page.tsx` — Feature-gated behind `NEXT_PUBLIC_ENABLE_TEAMS`
- `web/nextjs-saas-dashboard/files/src/app/(dashboard)/admin/billing/page.tsx` — Feature-gated behind `NEXT_PUBLIC_ENABLE_BILLING`
- `web/nextjs-saas-dashboard/files/src/app/(dashboard)/dashboard/page.tsx` — Simplified (auth handled by layout)
- `web/nextjs-saas-dashboard/files/src/app/(dashboard)/settings/page.tsx` — Simplified (auth handled by layout)
- `web/nextjs-saas-dashboard/files/src/app/(dashboard)/settings/profile/page.tsx` — Simplified (auth handled by layout)
- `web/nextjs-saas-dashboard/variant.json` — Added `optIn` features/routes sections

---

## [Unreleased] - 2026-04-02 - Added video platform with remotion variant

**Status:** COMPLETED

Added a new `video` platform type to gpp-templates for programmatic video generation using Remotion (React/TypeScript).

### Files added
- `video/remotion/variant.json` — Template metadata (platform: video, runtime: react)
- `video/remotion/files/package.json` — Remotion 4 + React 19 dependencies
- `video/remotion/files/tsconfig.json` — TypeScript config with path aliases
- `video/remotion/files/remotion.config.ts` — Remotion CLI configuration
- `video/remotion/files/src/index.ts` — Remotion root registration
- `video/remotion/files/src/Root.tsx` — Remotion entry point with CountryComparison composition
- `video/remotion/files/src/compositions/CountryComparison.tsx` — Starter composition: title card + country reveal sequence with spring animations
- `video/remotion/files/src/lib/types.ts` — Shared types (ChannelConfig, VideoData, CountryItem)
- `video/remotion/files/channels/example/config.json` — Example channel configuration (branding, fonts, tags, description template)
- `video/remotion/files/.claude/skills/youtube-channel-analyzer/SKILL.md` — Claude skill for reverse-engineering YouTube channel formulas
- `video/remotion/files/.claude/skills/youtube-channel-analyzer/fetch_channel.py` — Python script to fetch top videos + transcripts via yt-dlp
- `video/remotion/files/.claude/skills/youtube-channel-analyzer/requirements.txt` — yt-dlp + youtube-transcript-api
- `video/remotion/files/.claude/commands/youtube-channel-analyzer.md` — Slash command wiring
- `video/remotion/files/data/.gitkeep` — Video data directory
- `video/remotion/files/output/.gitkeep` — Rendered output directory
- `video/remotion/files/.gitignore` — Ignores node_modules, output MP4s, venv, .env

### Updated
- `gpp/gpp-ai.json` — Registered `video: ["remotion"]` in platforms object

---

## [Unreleased] - 2026-03-04 - Sync hero slider from gpp-cli

**Status:** COMPLETED

Synced hero slider files from gpp-cli for rotating hero images on blog site homepages.

### Files added
- `web/nextjs-headless-wp-cms/files/src/lib/hero-slides.ts` — WP GraphQL data fetcher
- `web/nextjs-headless-wp-cms/files/src/components/hero-carousel.tsx` — carousel component
- `web/nextjs-headless-wp-ecommerce/files/src/lib/hero-slides.ts`
- `web/nextjs-headless-wp-ecommerce/files/src/components/hero-carousel.tsx`
- `web/nextjs-headless-wp-full/files/src/lib/hero-slides.ts`
- `web/nextjs-headless-wp-full/files/src/components/hero-carousel.tsx`
- `web/nextjs-headless-strapi/files/src/lib/hero-slides.ts`
- `web/nextjs-headless-strapi/files/src/lib/hero-slides-strapi.ts` — Strapi REST data fetcher
- `web/nextjs-headless-strapi/files/src/components/hero-carousel.tsx`
- `cms/strapi-dev/files/src/components/hero/slide.json` — Strapi repeatable component
- `cms/strapi-dev/files/src/api/homepage/content-types/homepage/schema.json` — Strapi single type
- `cms/{cms-only,cms-ecommerce,ecommerce-cms,ecommerce-only}/files/wp-content/plugins/gp-hero-slider/` — WP plugin (CPT + ACF + WPGraphQL)
- `cms/{cms-only,cms-ecommerce,ecommerce-cms,ecommerce-only}/files/wp-content/plugins/gp-featured-items/` — synced from gpp-cli
- `cms/{cms-only,cms-ecommerce,ecommerce-cms,ecommerce-only}/files/wp-content/plugins/gp-headless-config/` — synced from gpp-cli
- `cms/{cms-only,cms-ecommerce,ecommerce-cms,ecommerce-only}/files/wp-content/plugins/gp-most-popular/` — synced from gpp-cli
- `cms/{cms-only,cms-ecommerce,ecommerce-cms,ecommerce-only}/files/wp-content/plugins/gp-social-poster/` — synced from gpp-cli
- `web/sveltekit-headless-wp-{cms,ecommerce,full}/files/src/lib/hero-slides.ts` — SvelteKit WP data fetcher
- `web/sveltekit-headless-strapi/files/src/lib/hero-slides.ts` — SvelteKit WP data fetcher
- `web/sveltekit-headless-strapi/files/src/lib/hero-slides-strapi.ts` — SvelteKit Strapi data fetcher
- `web/sveltekit-headless-wp-{cms,ecommerce,full,strapi}/files/src/lib/components/hero/HeroCarousel.svelte` — Svelte 5 carousel component

---

## [Unreleased] - 2026-02-27 - gpp-cli GitHub repo rename

**Status:** COMPLETED

Renamed the gpp-cli GitHub repository from `grasshopperpebbles/gpp` to `grasshopperpebbles/gpp-cli` to match the package name and local folder. Updated local remote URL.

### Notes
- The repo name `gpp` was incorrect and caused the repo to not appear on GitHub
- Future TODO: rename `gpp-templates` to `gpp-cli-templates` for consistency

---

## [Unreleased] - 2026-02-26 - Fix useSearchParams Suspense boundaries

**Status:** COMPLETED

Wrapped `useSearchParams()` in Suspense boundaries across all verify-email page templates to fix Next.js build failures.

### Files changed
- `add-ons/auth-flows/web/src/app/(auth)/verify-email/page.tsx` — split into inner component + Suspense wrapper
- `web/nextjs-headless-wp-full/files/src/app/verify-email/page.tsx` — same pattern (Card/shadcn variant)
- `web/nextjs-headless-wp-ecommerce/files/src/app/verify-email/page.tsx` — same
- `web/nextjs-headless-wp-cms/files/src/app/verify-email/page.tsx` — same
- `web/nextjs-headless-strapi/files/src/app/verify-email/page.tsx` — same

### Notes
- Reset-password pages already had Suspense boundaries; no changes needed
- CMS page templates already had proper null-checking; no changes needed
- Synced from same fix applied in gpp-cli and expatmusings

---

## [Unreleased] - 2026-02-25 - Full template sync from gpp-cli

**Status:** COMPLETED

Brought gpp-templates in sync with gpp-cli so both repositories have a complete, consistent set of templates. Add-ons and missing platform/shared templates were copied from gpp-cli.

### Add-ons added
- app-landing, appstore-content, firebase, npm-package, rate-limit, redis-cache, search, strapi-plugin, supabase
- auth-flows: web, api-express, api-fastapi synced from gpp-cli; desktop-tauri preserved (gpp-templates-only)

### Platform templates added
- **api:** express, fastapi (gpp-templates already had go-http, rust-axum)
- **web:** nextjs-webapp, nextjs-devtool-site
- **mobile:** expo (gpp-templates already had flutter-api-client, flutter-standalone)

### Shared assets added
- **gpp:** gpp-ai.md, gpp-ai.json, CONVENTIONS.md
- **logs:** Logging system template (archive_logs.mjs, ensure_log_capacity.mjs, PROJECT_LOGGING_SYSTEM.md, etc.)

### Notes
- Pre-existing changes in api/go-http, api/rust-axum, python/fastapi (cache-related) were left as-is.
- This repo is the extended template source for `gpp template install` and recipes; gpp-cli bundles a minimal set.

---
