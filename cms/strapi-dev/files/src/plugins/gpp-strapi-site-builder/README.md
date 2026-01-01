# GPP Strapi Site Builder Plugin

This plugin generates complete frontends from Strapi schemas and content.

## Architecture

Based on the documentation in `/docs/strapi/strapi_tool_bundle_docs/`:

1. **Schema Scan** - Introspects Strapi schemas and relations
2. **Inference Engine** - Identifies logical fields (title, summary, body, media)
3. **User Configuration** - Allows overrides via admin UI
4. **Blueprint Normalization** - Creates transport-agnostic, framework-agnostic core
5. **Code Generation** - Generates framework-specific code (Next.js, SvelteKit, Expo)

## Output

- Next.js (App Router) with shadcn/ui
- REST or GraphQL transport
- Safe regeneration strategy (`/generated` vs `/user` pattern)

## Development

This plugin is developed in this directory and tested with the development Strapi instance.

## Structure

```
src/plugins/gpp-strapi-site-builder/
├── README.md (this file)
├── strapi-admin.js (plugin registration)
├── package.json
├── server/
│   ├── controllers/
│   ├── services/
│   │   ├── schema-scanner.js
│   │   ├── inference-engine.js
│   │   └── code-generator.js
│   └── routes/
└── admin/
    └── src/
        └── index.jsx (admin UI)
```

## Next Steps

1. Create plugin structure following Strapi plugin conventions
2. Implement schema scanner
3. Implement inference engine
4. Implement code generator
5. Create admin UI for configuration

