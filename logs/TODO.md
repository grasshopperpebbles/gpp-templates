
---

## gpp-templates repository

**Repository:** [grasshopperpebbles/gpp-templates](https://github.com/grasshopperpebbles/gpp-templates)

This repo holds extended templates for GPP CLI. Install with:
```bash
gpp template install /path/to/gpp-templates --all
```

---

### FastAPI pack (2026-10-26)

- [x] Tests independent of the project's `.env`; dependencies current; PyJWT and bcrypt.
- [x] Redis client loads the package lazily, so a Redis opt-out can drop it.

### Server packs (2026-10-25)

- [x] `api/fastapi`: Docker, tests, Redis, auth, security fixes; identical to gpp-cli's bundled copy.
- [x] `api/express`, `api/express-mysql`, `api/go-http`: Dockerfile, tests, security fixes; Express copies equal gpp-cli's bundled ones.
- [ ] Express: user list/view and `POST /users` are open to any logged-in user; no refresh-token rotation.
- [x] Go: Postgres data layer (pgx v5, embedded migrations, `/ready`) (2026-10-26).
- [ ] Go: a recipe or `gpp add api` run with go-http has not been scaffolded end to end with the new data layer (only the pack, rendered by hand).

### Tauri and Chrome MV3 packs (2026-10-26)

- [x] `desktop/tauri` and `extension/chrome-mv3` install, type-check, test, build and run (see CHANGELOG 2026-10-26).
- [ ] gpp-cli: `runner.ts` uses `npm run tauri dev/build` and `variantMetadata` npm commands for chrome-mv3 while both packs document pnpm.
- [ ] gpp-cli auth-flows: if it ever adds its commands to `build.rs` + the capability, the Tauri pack can switch to a per-command ACL.

### Electron desktop pack (2026-10-25)

- [x] Make `desktop/electron` install, build, lint, test, run and package (see CHANGELOG 2026-10-25).
- [ ] Ship default icons in `build/` and document a `publish` example for auto-updates.
- [ ] Dev restarts Electron by hand after main-process edits; consider `tsc --watch` + a restart helper (or electron-vite) if that gets in the way.

**Tasks:**
- [ ] Next packs refresh for Next 16 — COMPLETED (owner approved, merged 2026-10-19)
  - [x] Native eslint flat config + `eslint` lint script in all 13 Next packs (FlatCompat crashed; `next lint` is gone in Next 16; landing had eslint 8)
  - [x] next / eslint-config-next / @next/mdx 16.4.2, exact react pins 19.1.0 → 19.3.1
  - [x] `.nvmrc` 20 → 22 everywhere; Strapi Dockerfiles `node:22-alpine`
- [ ] Pre-existing broken Next packs (same failures before the refresh; lint now runs and shows real errors): admin-dashboard (`CardDescription` export), app-landing + webapp (`tailwindcss-animate` missing), headless-storyblok (`StoryblokClient`/`StoryblokComponent` exports), headless-strapi + headless-wp-cms (missing cart/product modules), headless-wp-ecommerce (missing `@/lib/admin-settings`, email modules), headless-wp-full + saas-dashboard (type errors), headless-sanity (build needs `projectId`), marketing (`/pagefind/pagefind.js` type before postbuild). Only nextjs-landing is fully green; devtool-site builds.
- [x] Strapi docker-compose: require `${PROJECT_SLUG}` (remove `:-strapi` / `:-strapi-dev`); strapi-dev `setup.sh` + `env/.env.example`; sync with gpp-cli; update logs — COMPLETED (2026-04-08)
- [x] Add container_name with ${PROJECT_SLUG} prefix to all backend docker-compose templates (python/fastapi, api/go-http, api/rust-axum, worker/celery-python, worker/rust-tokio) - COMPLETED (2026-04-04)
- [x] SaaS dashboard: add feature flags for team/billing (off by default), create dashboard route group layout, bundle into gpp-cli - COMPLETED (2026-04-04)
- [x] Sync hero slider from gpp-cli: hero-slides.ts, hero-slides-strapi.ts, hero-carousel.tsx to 4 web variants + Strapi schemas to strapi-dev - COMPLETED (2026-03-04)
- [x] Fix useSearchParams Suspense boundaries in all verify-email templates (5 files) - COMPLETED (2026-02-26)
- [x] Sync all templates from gpp-cli (add-ons, api/express, api/fastapi, web/nextjs-webapp, nextjs-devtool-site, mobile/expo, gpp/, logs/) - COMPLETED (2026-02-25)
- [ ] Keep add-ons and shared templates in sync with gpp-cli when making changes (or treat gpp-cli as source and periodically sync here)
- [ ] Rename `gpp-templates` repo to `gpp-cli-templates` for consistency with gpp-cli repo rename

---
