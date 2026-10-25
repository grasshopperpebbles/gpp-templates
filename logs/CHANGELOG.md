
---

## [Unreleased] - 2026-10-25 - FastAPI pack with Docker, tests, Redis and auth; API + desktop recipe

**Status:** COMPLETED

- `api/fastapi`: merged with gpp-cli's bundled copy (which had auth) into one pack, identical in both repos: auth (register, login, refresh, `/auth/me`, `PATCH /users/me`), non-root Dockerfile + `.dockerignore`, Redis client (`/health` reports `redis: ok | unavailable | disabled`, never fails on it), users migration, pytest (44 tests; SQLite for auth; `requirements-dev.txt`, `pytest.ini`).
- `api/fastapi` fixes: online alembic migrations never ran; comma-separated `CORS_ORIGINS` didn't parse; missing `bcrypt==4.0.1` / `email-validator` pins. Security: refresh tokens no longer authenticate, inactive users are refused, `allow_credentials=False`, startup fails in production with the default `JWT_SECRET`, constant-time login for unknown emails, passwords 8–72.
- `recipes/desktop/electron-fastapi-postgres.yaml` (same as gpp-cli's bundled copy).
- `desktop/electron`: production CSP adds `connect-src` for `VITE_API_BASE_URL` (`config/csp.ts`, tested), warns for plain `http` to a remote host; `src/lib/api.ts`; README "Calling an API".
- Repo: root `.gitignore` for `.env` and `.DS_Store`; `python/fastapi`'s committed `.env` (admin credentials) and three `.DS_Store` files untracked. The `.env` values remain in git history.

## [Unreleased] - 2026-10-25 - Desktop and extension dev servers get their own ports

**Status:** COMPLETED

- `desktop/electron` 5180 (vite.config, `wait-on`, `VITE_DEV_SERVER_URL`, README), `desktop/tauri` 1420 (vite.config and `tauri.conf.json` devUrl; Tauri's own default), `extension/chrome-mv3` 5190 (dev server and HMR). They all used 5173, which SvelteKit and Strapi's admin keep, so a project with web + desktop couldn't run both. Each README names its port and the files to change together. gpp-cli 0.9.98 lists the ports in its port table.

## [Unreleased] - 2026-10-25 - Electron desktop pack builds, runs and packages

**Status:** COMPLETED

- `desktop/electron`: every script works on a clean install. Before, `build` (no root `index.html`), `build:electron` (TS5096), `type-check`, `lint` (ESLint 9 with `.eslintrc.cjs`, no TS parser) and `vitest` (v4 needs Vite 6) failed, pnpm 10 skipped Electron's binary download, and the built app could not start (ESM main without `"type": "module"`, ESM preload in a sandboxed window, absolute asset paths under `file://`).
- Main + preload build to `dist-electron/` (`main.js` ESM, `preload.cjs` from `preload.cts`); `index.html` at the root; Vite `base: './'`, production CSP injected at build; `pnpm.onlyBuiltDependencies` for electron/esbuild; Vite 6; ESLint 9 flat config with typescript-eslint; `electron-rebuild` → `@electron/rebuild`; unused `electron-debug` and `tsx` dropped.
- Hardening: IPC handlers check the sender frame and validate arguments (`getPath` allow-list, settings keys without `__proto__`/`constructor`), channel names in `electron/ipc/channels.ts` with a test against the preload, external links open in the system browser, in-app navigation blocked, single-instance lock, window shown on `ready-to-show`, dev mode only when not packaged, auto-update only when packaged with a `publish` config, startup errors logged.
- Identity from the project: `name` `{{PROJECT_SLUG}}-desktop`, `appId` `com.{{PROJECT_SLUG}}.desktop`, `productName` `{{PROJECT_SLUG}}` (was `desktop_app` / `com.example.desktop-app` for every app).
- README rewritten to match (its examples called a `window.electronAPI.invoke` that never existed).

## [Unreleased] - 2026-10-19 - Next packs refresh for Next 16

**Status:** COMPLETED (merged 2026-10-19)

- All 13 `web/nextjs-*` packs: `eslint.config.mjs` uses `eslint-config-next/core-web-vitals` + `/typescript` natively (`defineConfig`, `globalIgnores`); lint script `eslint`; `@eslint/eslintrc` dropped; eslint ^9 (landing had ^8, which broke `npm install`; devtool-site had none).
- next, eslint-config-next, @next/mdx 16.1.0 → 16.4.2; exact react/react-dom 19.1.0 → 19.3.1.
- Every `.nvmrc` 20 → 22 (Node 20 EOL 2026-04-30); Strapi Dockerfiles `node:22-alpine` (Strapi 5 allows <=22).

## [Unreleased] - 2026-04-08 - Log verification and push

**Status:** COMPLETED

Reviewed **CHANGELOG**, **DEVELOPMENT**, **TODO**, and **STRATEGY_NOTES** for the Strapi/CMS/API template parity slice; committed and pushed to **`origin/main`**.

## [Unreleased] - 2026-04-08 - Project slug naming (Strapi compose + env)

**Status:** COMPLETED

Aligned **Strapi** Docker templates with **WordPress CMS**: **`docker-compose.yml`** uses **`${PROJECT_SLUG}`** only for compose project **`name`**, **`container_name`**, and image tags (removed **`:-strapi`** / **`:-strapi-dev`**). **`cms/strapi-dev`** `env/.env.example` uses **`{{PROJECT_SLUG}}`** with guidance to avoid tutorial slugs; **`setup.sh`** requires **`PROJECT_SLUG`** (export or `.env`) instead of defaulting to `strapi-dev`. Sibling **`gpp-cli`** bundles the same files.

### Files modified
- `cms/strapi-only/files/docker-compose.yml`
- `cms/strapi-dev/files/docker-compose.yml`
- `cms/strapi-dev/files/env/.env.example`
- `cms/strapi-dev/files/setup.sh`

### Rationale
- No generic Docker identity when **`PROJECT_SLUG`** is unset; slug comes from **`gpp init` / recipe apply**, matching the WordPress CMS variants.

## [Unreleased] - 2026-04-08 - Express + MySQL API template and Next.js SaaS recipe

**Status:** COMPLETED

Added **`api/express-mysql`** (Express, TypeScript, Prisma with **MySQL**) and SaaS recipe **`recipes/saas/nextjs-express-mysql.yaml`** (Next.js dashboard + Express API, **`next_to_express`** adapter). Kept in lockstep with **`gpp-cli`** bundled fallbacks and `crossRepoContract` expectations.

### Files added
- `api/express-mysql/` — template tree (`variant.json`, `files/` with Prisma schema, env examples, README)
- `recipes/saas/nextjs-express-mysql.yaml`

### Rationale
- Same recipe and pack IDs as `gpp-cli` so offline bundle, init flows, and sibling-repo contract tests stay aligned.

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
