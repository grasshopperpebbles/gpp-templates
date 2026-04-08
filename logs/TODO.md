
---

## gpp-templates repository

**Repository:** [grasshopperpebbles/gpp-templates](https://github.com/grasshopperpebbles/gpp-templates)

This repo holds extended templates for GPP CLI. Install with:
```bash
gpp template install /path/to/gpp-templates --all
```

---

**Tasks:**
- [x] Strapi docker-compose: require `${PROJECT_SLUG}` (remove `:-strapi` / `:-strapi-dev`); strapi-dev `setup.sh` + `env/.env.example`; sync with gpp-cli; update logs — COMPLETED (2026-04-08)
- [x] Add container_name with ${PROJECT_SLUG} prefix to all backend docker-compose templates (python/fastapi, api/go-http, api/rust-axum, worker/celery-python, worker/rust-tokio) - COMPLETED (2026-04-04)
- [x] SaaS dashboard: add feature flags for team/billing (off by default), create dashboard route group layout, bundle into gpp-cli - COMPLETED (2026-04-04)
- [x] Sync hero slider from gpp-cli: hero-slides.ts, hero-slides-strapi.ts, hero-carousel.tsx to 4 web variants + Strapi schemas to strapi-dev - COMPLETED (2026-03-04)
- [x] Fix useSearchParams Suspense boundaries in all verify-email templates (5 files) - COMPLETED (2026-02-26)
- [x] Sync all templates from gpp-cli (add-ons, api/express, api/fastapi, web/nextjs-webapp, nextjs-devtool-site, mobile/expo, gpp/, logs/) - COMPLETED (2026-02-25)
- [ ] Keep add-ons and shared templates in sync with gpp-cli when making changes (or treat gpp-cli as source and periodically sync here)
- [ ] Rename `gpp-templates` repo to `gpp-cli-templates` for consistency with gpp-cli repo rename

---
