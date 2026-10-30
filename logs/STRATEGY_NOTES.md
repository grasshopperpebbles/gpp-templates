
---

## Web packs keep API tokens on the server (2026-10-29)

**Decision:** a Next pack that signs in with NextAuth keeps the API token in the JWT cookie only. The session callback never exposes it, and browser code calls same-origin routes that add it on the server and refuse cross-origin writes. Started with `nextjs-admin-dashboard`; `nextjs-saas-dashboard` and `nextjs-webapp` still expose it (TODO).

**Rationale:** any script injected into a page (an XSS, a compromised dependency) could read `session.accessToken` and call the API directly, for as long as the token lives. An admin app is the worst place for that. The same-origin forwarder also matches what `gpp admin generate-crud` pages already call (`/api/admin/<model>`).

## Tauri pack: no AppManifest command list while add-ons register commands (2026-10-26)

**Decision:** `desktop/tauri` keeps `tauri_build::build()` and a `core:default` capability; its IPC commands enforce their own limits (app data folder only, program allowlist, app-scoped keychain). No `AppManifest::commands` list.

**Rationale:** with that list Tauri refuses every app command the capability doesn't grant, and gpp-cli's auth-flows add-on registers `auth::*` commands without editing `build.rs` or the capability, so they would fail at runtime. Revisit if the add-on learns to add its commands there.

## Go pack: a set DATABASE_URL must work; /health stays liveness (2026-10-26)

**Decision:** with `DATABASE_URL` set the Go API fails startup if Postgres stays unreachable, instead of falling back to memory; readiness is a separate `/ready`, and the compose healthcheck keeps probing `/health`. Migrations are embedded SQL files with a small runner, not a framework.

**Rationale:** a silent memory fallback loses writes. The server listens only after connecting and migrating, so compose's healthy state already means the data layer came up, while a later DB blip doesn't mark the API unhealthy. One table doesn't justify goose/golang-migrate; the README points to them.

## Change a bundled pack in both repos (2026-10-26)

**Decision:** packs that gpp-cli also bundles are changed in both repos in the same session; gpp-cli's `npm run check:packs` fails on any difference.

**Rationale:** 11 shared packs had drifted, including a security fix only in gpp-cli's copy.

## Server packs: Docker, tests and Redis included; bundled copies stay identical (2026-10-25)

**Decision (operator):** server packs ship a Dockerfile, a test setup and Redis wired in (operator uses Redis in most projects; recipes opt out). A pack also bundled in gpp-cli must be byte-identical to this repo's copy.

**Rationale:** gpp's rule is backends in Docker and test-first work; the bundled FastAPI copy had auth and this one didn't, so results depended on the machine.

## Each dev server gets its own default port (2026-10-25)

**Decision:** packs that run a dev server get a default port no other pack or gpp-cli `variantMetadata` entry uses, and gpp-cli records it in `variantMetadata` so the generated port table shows it. Electron 5180, Tauri 1420, chrome-mv3 5190.

**Rationale:** Vite's default 5173 everywhere meant two apps in one project couldn't run together, and Electron's `strictPort` made it a hard failure.

## Electron pack: ESM main, CommonJS preload, verified by running it (2026-10-25)

**Decision:** The Electron pack keeps an ESM main process (`"type": "module"`, NodeNext) with the preload as `.cts` → `preload.cjs`, since Electron requires CommonJS for sandboxed preloads. Renderer access goes only through named preload calls whose handlers check the sender and validate arguments. App identity comes from `{{PROJECT_SLUG}}`. A desktop pack counts as working only after install, build, type-check, lint, tests, an in-Electron run and an `electron-builder` package.

**Rationale:** the pack had never been run: every script failed and the app couldn't start, yet its README and variant.json claimed security best practices. ESM main matches electron-store 10 (ESM-only). broadkast's shell shows the IPC pattern holds up in a real app.

## Next packs: native eslint flat config, Node 22 (2026-10-19)

**Decision:** Next packs use `eslint-config-next`'s native flat exports and the script `eslint`; no `FlatCompat`, no `next lint`. `.nvmrc` follows the active LTS (22), the same as gpp-cli `DEFAULT_NODE_VERSION`.

**Rationale:** FlatCompat crashes under eslint-config-next 16, and Next 16 removed `next lint`, so lint was silently broken in every pack. Pack verification must include a clean install, lint and build; most packs don't build today, and nobody noticed because nothing checks them.

## Docker `PROJECT_SLUG` must not use tutorial defaults on CMS/Strapi project identity (2026-04-08)

**Decision:** For **WordPress CMS** and **Strapi** templates, compose **`name`**, **`container_name`** (and Strapi **image** tags derived from the slug) use **`${PROJECT_SLUG}`** with **no** default such as **`:-strapi`** or **`:-headless`**. **`PROJECT_SLUG`** is set by **`gpp init` / recipe apply** or must be provided manually.

**Rationale:** Shell defaults produce duplicate container/volume names across unrelated checkouts and invite tutorial copy-paste. Strapi is now consistent with the WordPress CMS variants.

## Docker container naming convention (2026-04-04)

**Decision:** All backend docker-compose templates must set `container_name: ${PROJECT_SLUG}-<service>` (or the same pattern with a **required** `PROJECT_SLUG`) on every service. Optional **`${PROJECT_SLUG:-<default>}`** is **not** used for CMS/Strapi project identity (see 2026-04-08 note above). For other backends where a tiny default is still acceptable, prefer explicit `container_name` with `${PROJECT_SLUG}` once the project defines it.

**Rationale:** Without explicit container names, Docker uses bare service names (`redis`, `db`) which collide across projects and are unidentifiable in Docker Desktop. Commented-out optional services should also include the pattern so it is correct when uncommented.

---

## Feature flags for opt-in template features (2026-04-04)

**Decision:** Multi-tenant features (team management, billing) in the `nextjs-saas-dashboard` template are controlled by runtime env vars (`NEXT_PUBLIC_ENABLE_TEAMS`, `NEXT_PUBLIC_ENABLE_BILLING`), defaulting to `false`. All code is scaffolded but dormant until the user sets the flag to `true`.

**Rationale:** Runtime flags (vs build-time scaffolder exclusion) mean users can enable features by flipping an env var without re-scaffolding. The code cost of including dormant features is minimal (two page files + sidebar conditionals). This pattern extends the existing `features` object in `config.ts` that already gates auth and API integration.

---

## Hero slider sync scope (2026-03-04)

**Decision:** Full sync of hero slider to gpp-templates: Next.js web variants, SvelteKit web variants (with Svelte 5 component port), Strapi schemas, and WP plugin to all CMS variants.

**Rationale:** gpp-templates should have feature parity across all variant families. The WP plugin was added to CMS variants under `files/wp-content/plugins/` so it's available when templates are installed. The Svelte carousel uses `$state`/`$effect` runes (Svelte 5), inline SVG chevrons (no lucide dependency), and native `<img>` (no Next.js `Image`), matching the existing SvelteKit template patterns.

---

## Template build resilience (2026-02-26)

**Decision:** All page templates using `useSearchParams()` must wrap the call in a `<Suspense>` boundary.

**Rationale:** Next.js static generation fails if `useSearchParams()` is called without Suspense. This was discovered in expatmusings and traced to GPP templates. The fix was applied across gpp-cli, gpp-templates, and the downstream project.

**Pattern:** Split client pages into an inner content component (calls `useSearchParams()`) and an outer page export that wraps it in `<Suspense fallback={...}>`.

---

## Template sync with gpp-cli (2026-02-25)

**Status:** DONE (one-way sync gpp-cli → gpp-templates)

### Roles of the two repos

- **gpp-cli** bundles a minimal template set in `templates/`; add-on and platform commands read from that bundle.
- **gpp-templates** is the extended template repo for `gpp template install` and for recipes (fetched from GitHub). It should contain the full set so installs and recipe resolution have everything they need.

### Sync performed

All add-ons and missing platform/shared templates were copied from gpp-cli to gpp-templates so both repos are aligned. Add-ons: app-landing, appstore-content, firebase, npm-package, rate-limit, redis-cache, search, strapi-plugin, supabase; auth-flows (web, api-express, api-fastapi) synced while preserving desktop-tauri. Platform: api/express, api/fastapi, web/nextjs-webapp, web/nextjs-devtool-site, mobile/expo. Shared: gpp/, logs/.

### Going forward

- When changing add-ons or shared templates, update both gpp-cli and gpp-templates, or treat gpp-cli as source and periodically sync here.
- If gpp-cli later removes templates from its bundle (per roadmap), gpp-templates will already have the full set for installs.

---
