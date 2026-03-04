
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
