
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
