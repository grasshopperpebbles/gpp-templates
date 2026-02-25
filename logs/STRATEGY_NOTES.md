
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
