
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
