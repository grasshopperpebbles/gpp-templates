
---

## Hero slider sync scope (2026-03-04)

**Decision:** Sync frontend files (data fetchers + carousel component) and Strapi schemas to gpp-templates, but not the WordPress plugin. SvelteKit variants are excluded since the carousel is React-only.

**Rationale:** gpp-templates CMS variants don't bundle WP plugins — they rely on `install-plugins.sh` for plugin installation. The `gp-hero-slider` plugin is bundled in gpp-cli's `templates/cms/wp-content/plugins/` and copied at scaffolding time by `cms.ts`. SvelteKit variants would need a Svelte-native carousel component, which is out of scope for this sync.

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
