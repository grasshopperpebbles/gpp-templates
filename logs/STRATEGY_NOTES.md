
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
