
---

## Session: Express and Go packs (2026-10-26)

**Status:** COMPLETED

Companion to gpp-cli 0.9.100. Evidence: Express 58/58 per pack (host and node:22); images against Postgres and MySQL with migrate deploy, A→B 403, placeholder secret exits 1; the arm64 openssl-3.0.x Prisma engine is in the image; Go gofmt/vet/`go test -race` clean in golang:1.26, images healthy on :8080 and :9090, unknown JSON field 400, 2 MiB body 413. Real recipe applies (nextjs-express-mysql, nextjs-go-postgres) healthy.

## Session: FastAPI pack and API + desktop recipe (2026-10-25)

**Status:** COMPLETED

Companion to gpp-cli 0.9.99 (see its DEVELOPMENT.md). Evidence, all in Docker with python:3.12 (local python is 3.14): pytest 44/44; `docker compose up --build --wait` with postgres + redis + api healthy; `/health` `{"status":"ok","redis":"ok"}`; `alembic upgrade head` creates `users` and `alembic check` is clean; curl register 201 / duplicate 409 / login + `/auth/me` 200 / wrong password 401; refresh token on `/auth/me` 401; Redis stopped → `/health` 200 `redis: unavailable`; production mode with the default secret exits 3. Electron: vitest 13, builds with/without `VITE_API_BASE_URL` (CSP checked in `dist/index.html`), build:electron, type-check, lint.

## Session: Dev ports for desktop and extension packs (2026-10-25)

**Status:** COMPLETED

Every Vite-based pack used 5173. Checked every port in gpp-cli `variantMetadata` and the packs (3000, 3001, 5432, 6379, 8000, 3307, 3308, 9091, 9092, 1337, 1338, 8081, 5173) before choosing 5180 / 1420 / 5190. Evidence: Electron scratch copy install, build, build:electron, type-check, lint, vitest 7/7; Vite answered on 5180 and `wait-on` resolved. Tauri configs agree (Rust not built). gpp-cli review of the branch found the ports consistent everywhere.

## Session: Electron desktop pack made robust (2026-10-25)

**Status:** COMPLETED

Trigger: operator asked for a robustness evaluation of Electron in gpp. Baseline in a scratch copy with pnpm 10: `build`, `build:electron`, `type-check`, `lint` and `vitest run` all failed, and `electron` had no binary (pnpm 10 blocks build scripts). By inspection the built app could not have started either (CommonJS-loaded ESM main, ESM sandboxed preload, `/assets` paths under `file://`). Compared against broadkast's `apps/broadkast-main-electron-desktop` (sender-checked IPC, channel constants with a preload test, safe URL parsing) and adopted those patterns; picturechronicles has no Electron app.

Evidence after the fix, on the copy `gpp add desktop electron` writes (temp HOME, project `zorbly`): install ✔ (Electron binary present), build ✔, build:electron ✔, type-check ✔, lint ✔, vitest 7/7 ✔. A harness that loads `dist-electron/main.js` in real Electron confirmed, in production and dev (Vite server) modes: preload loads, `window.electronAPI` works, `ipcRenderer` not exposed, React renders, settings round-trip, `getPath('userData')` and the `__proto__` key are refused, CSP present in production. `electron-builder --dir` packages `zorbly.app` (ad-hoc signed locally), and the packaged app starts ("Production mode: loading from dist") with no errors once the updater is skipped without `app-update.yml`.

## Session: Next packs refresh for Next 16 (2026-10-19)

**Status:** COMPLETED

Trigger: `gpp init --recipe nextjs-static` (pimpmyoptions) produced an app whose `npm install` failed (eslint 8 vs eslint-config-next 16) and whose lint script was `next lint`. Companion gpp-cli branch `fix/init-next16-refresh` syncs the bundled copies.

Evidence (clean `npm install`, `npm run lint`, `npm run build` per pack, in a scratch dir):
- nextjs-landing: install ✔, lint ✔, build ✔, `npm audit --omit=dev` 0 vulnerabilities. Also end to end through `gpp init` after `gpp template install --force`.
- Other 12: install ✔ everywhere. Builds: devtool-site ✔; the other 11 fail identically at the unchanged baseline (HEAD archived and run the same way); 16.4.2 just prints every error instead of the first. Lint at baseline crashed (`Converting circular structure to JSON` from FlatCompat, `Invalid project directory` from `next lint`, or no config); now it runs and reports real code errors (no-explicit-any, no-unescaped-entities, react-hooks set-state-in-effect, ...). Listed in TODO as a follow-up.

## Session: Log verification and push (2026-04-08)

**Date:** 2026-04-08  
**Focus:** Confirm **CHANGELOG**, **DEVELOPMENT**, **TODO**, and **STRATEGY_NOTES** match the template changes; commit and **`git push`** **`origin/main`**.

**Status:** COMPLETED

## Session: Project slug naming — Strapi compose and strapi-dev setup (2026-04-08)

**Date:** 2026-04-08  
**Focus:** Require **`PROJECT_SLUG`** in Strapi **`docker-compose.yml`** (no `:-strapi` defaults); **`strapi-dev`** env template and **`setup.sh`** aligned with GPP slug rules; logs updated.

### Context
WordPress CMS variants already used **`${PROJECT_SLUG}`** without compose defaults. Strapi still used **`${PROJECT_SLUG:-strapi}`**, which hid missing slugs and encouraged tutorial-style identities.

### What changed
- **`cms/strapi-only`** and **`cms/strapi-dev`** compose: **`name`**, container names, Strapi image — **`${PROJECT_SLUG}`** only.
- **`cms/strapi-dev/files/env/.env.example`**: **`PROJECT_SLUG={{PROJECT_SLUG}}`** plus comment (no hardcoded `strapi-dev`).
- **`cms/strapi-dev/files/setup.sh`**: fail fast if **`PROJECT_SLUG`** not in environment or `.env`.

### Result
**`gpp-templates`** matches **`gpp-cli`** bundled Strapi templates for Docker naming; **CHANGELOG**, **DEVELOPMENT**, **TODO**, **STRATEGY_NOTES** record the decision.

## Session: Express + MySQL API template and Next.js SaaS recipe (2026-04-08)

**Date:** 2026-04-08  
**Focus:** Mirror **`gpp-cli`** additions: **`api/express-mysql`** bundled template and **`recipes/saas/nextjs-express-mysql.yaml`**.

### Context

`gpp-cli` gained a first-class **`express-mysql`** API variant (Prisma MySQL), recipe apply logic for a root **MySQL** docker service, and the **`next_to_express`** adapter. The sibling **`gpp-templates`** repo must expose the same **`api/express-mysql`** tree and recipe file so `crossRepoContract` and recipe fetch paths do not drift.

### What changed

- Added **`api/express-mysql/`** (copied from `gpp-cli` bundled template: `variant.json`, `files/`).
- Added **`recipes/saas/nextjs-express-mysql.yaml`** (Next.js SaaS dashboard + `api/express-mysql`, `next_to_express`).

### Result

Bundled and remote template sources agree on **`express-mysql`** and the **Next.js + Express + MySQL** SaaS recipe.

## Session: Align FastAPI recipes with patched gpp-cli init flow (2026-04-06)

**Date:** 2026-04-06
**Focus:** Sync `gpp-templates` recipe references with the fixed `gpp-cli` recipe/apply behavior after `meme-battles` exposed mismatches.

### Context

The SaaS FastAPI recipe still referenced `python/fastapi` and the hyphenated adapter name `nextjs-to-fastapi`. After reviewing the regenerated `meme-battles` failure and the working `tubekast` project, it was clear the recipe pack IDs and adapter IDs had to be aligned with the CLI's current naming and adapter registry.

### What changed

- `recipes/saas/nextjs-fastapi-postgres.yaml`
  - switched FastAPI workspace pack from `python/fastapi` to `api/fastapi`
  - switched adapter ID from `nextjs-to-fastapi` to `next_to_fastapi`
- `recipes/mobile/flutter-fastapi.yaml`
  - switched FastAPI workspace pack from `python/fastapi` to `api/fastapi`

### Result

`gpp-templates` recipes now match the patched `gpp-cli` behavior, so future recipe installs and recipe-based project scaffolds stay aligned instead of reproducing the same init mismatch.

## Session: Docker container naming conventions (2026-04-04)

**Date:** 2026-04-04
**Focus:** Add `container_name` to backend docker-compose templates that were missing it.

### Context

Five backend templates had no `container_name` set in their docker-compose.yml files. This caused Docker Desktop to show bare generic names (`redis`, `db`) that are indistinguishable across projects. CMS/Strapi templates already prefixed services with **`PROJECT_SLUG`** (Strapi later tightened to **required** `${PROJECT_SLUG}` with no compose default — see 2026-04-08 session).

### What changed

- Added `container_name: ${PROJECT_SLUG}-<service>` (or equivalent with required slug) to all active and commented-out services in:
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
