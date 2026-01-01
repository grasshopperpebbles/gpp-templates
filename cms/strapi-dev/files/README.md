# Strapi Development Platform

Strapi 5 development instance for plugin development and testing.

## Known Issues

### Zod/v4 Build Errors (Strapi 5.33.0)

Strapi 5.33.0 has a known dependency conflict where `@strapi/content-type-builder` uses `@ai-sdk/react` which requires `zod/v4` subpath exports, but Strapi pins `zod@3.25.67` which doesn't support these exports.

**Symptoms:**
```
Could not resolve "zod/v4"
Could not resolve "zod/v3"
```

**Workaround:**
Install `zod@4.2.1` in the root `package.json`:
```bash
npm install zod@4.2.1 --legacy-peer-deps
```

This is a temporary workaround until Strapi fixes the dependency conflict in a future release.

