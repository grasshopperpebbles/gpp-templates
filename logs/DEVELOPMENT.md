
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
