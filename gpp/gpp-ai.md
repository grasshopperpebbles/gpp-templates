# GPP AI Capabilities & Rules

This file describes what AI assistants (Claude, Cursor, ChatGPT, etc.) are
allowed and expected to do inside a GrasshopperPebbles Project (GPP).

## Project Detection
- Presence of `.gpp/` means this is a GPP-managed project
- AI must respect platform isolation and gpp workflows
- Check `.gpp/deploy.json` for enabled platforms and variants

## Supported Platforms & Variants

### Web (Next.js)
- **generic**: Basic Next.js app with standard pages (about, privacy, terms, contact)
- **headless-wp-cms**: WordPress headless CMS frontend (articles, blog)
- **headless-wp-ecommerce**: WordPress e-commerce frontend (products, cart, checkout)
- **headless-wp-full**: WordPress full stack (CMS + e-commerce)
- **saas-dashboard**: Customer-facing SaaS dashboard with auth, data visualization, admin features
- **admin-dashboard**: Platform-level admin interface (user management, CRUD generation)

### API
- **fastapi**: Python FastAPI backend
  - REST API (default)
  - Optional GraphQL server support (Strawberry GraphQL)
  - Install: `pip install 'strawberry-graphql[fastapi]'`
  - Enable: Uncomment GraphQL router in `app/main.py`
  - Access: `http://localhost:8000/graphql`
  - Both REST and GraphQL can be used simultaneously
  - Same Bearer token authentication for both
- **express**: Node.js/Express backend

### CMS
- **cms-only**: WordPress CMS only
- **ecommerce-only**: WooCommerce only
- **cms-ecommerce**: WordPress + WooCommerce
- **ecommerce-cms**: WooCommerce + WordPress

### Mobile
- **flutter-api-client**: Flutter app with API integration
- **flutter-standalone**: Standalone Flutter app

### Desktop
- **electron**: Electron desktop application

## Supported AI Actions
AI MAY:
- Read project structure
- Read logs under `logs/` and platform logs
- Update code inside a single platform when instructed
- Propose `gpp` commands instead of manual edits
- Update TODO.md, DEVELOPMENT.md, CHANGELOG.md, and STRATEGY_NOTES.md when making changes

AI MUST:
- Read `.gpp/CONVENTIONS.md` before modifying API or routing code (if present)
- Prefer `gpp add/remove/convert` over manual scaffolding
- Use `gpp add route` when adding new pages/routes
- Use `gpp add api` when adding new domain-specific APIs
- Treat templates as read-only
- Avoid cross-platform edits unless explicitly requested
- Assume databases require backups before schema changes
- Check `.gpp/deploy.json` to understand platform configuration
- Respect variant-specific patterns (e.g., don't add WordPress features to generic variant)

AI MUST NOT:
- Modify `.gpp/deploy.json` without user confirmation
- Run destructive commands without confirmation
- Invent deploy or CI behavior not implemented in gpp
- Mix variant patterns (e.g., adding WordPress GraphQL to generic variant)
- Enable GraphQL server in FastAPI without user request (it's optional, commented by default)
- Enable GraphQL server in FastAPI without user request (it's optional, commented by default)

## Logging Expectations
- Update TODO.md before starting work
- Update DEVELOPMENT.md after completing work
- Update CHANGELOG.md for version changes
- Update STRATEGY_NOTES.md for architectural decisions
- Never overwrite logs
- Respect log archiving rules

## Platform-Specific Guidelines

### Web Variants
- **Generic**: Basic pages, optional API/CMS integration
  - Optional REST API client
  - Optional GraphQL client (for FastAPI, Strapi, WordPress)
- **SaaS Dashboard**: Requires `api` platform, includes auth, React Query, admin features
  - REST API client (default)
  - Optional GraphQL client
- **Admin Dashboard**: Requires `api` platform, admin-only, supports CRUD generation
  - REST API client (default)
  - Optional GraphQL client
- **WordPress variants**: Require `cms` platform, use GraphQL client (WPGraphQL)

### API Variants
- **FastAPI**: Python backend
  - REST API (default)
  - Optional GraphQL server support (Strawberry GraphQL)
  - Install: `pip install 'strawberry-graphql[fastapi]'`
  - Enable: Uncomment GraphQL router in `app/main.py`
  - Access: `http://localhost:8000/graphql`
  - Both REST and GraphQL can be used simultaneously
  - Same Bearer token authentication for both
- **Express**: Node.js backend, standard middleware stack

## UI Components (Web Templates)

GPP web projects use **shadcn/ui**. Always use shadcn components instead of plain HTML.

| Instead of... | Use shadcn... |
|---------------|---------------|
| `<button>` | `<Button>` from `@/components/ui/button` |
| `<input>` | `<Input>` from `@/components/ui/input` |
| `<select>` | `<Select>` from `@/components/ui/select` |
| `<textarea>` | `<Textarea>` from `@/components/ui/textarea` |
| `<div class="card">` | `<Card>` from `@/components/ui/card` |

Add new components: `npx shadcn@latest add [component-name]`

See `.gpp/CONVENTIONS.md` for full component list and examples.

## Scaffolding Commands

### Add Route
Create a new page/route with API integration:
```bash
gpp add route /path/to/route      # Creates page with apiClient usage
gpp add route /settings --static  # Creates static page without API
```

### Add API
Create a new domain-specific API module:
```bash
gpp add api billing    # Creates billingApi in src/lib/api.ts
gpp add api analytics  # Creates analyticsApi with CRUD methods
```

Generated APIs include: `list`, `getById`, `create`, `update`, `delete` methods.

## API Patterns (Web Templates)

Web templates support two coexisting API patterns:

1. **Generic `apiClient`** - For simple, one-off API calls
   ```typescript
   import { apiClient } from "@/lib/api";
   const data = await apiClient.get("/endpoint");
   ```

2. **Domain-specific APIs** - For features with 3+ related endpoints
   ```typescript
   import { billingApi } from "@/lib/api";
   const invoices = await billingApi.list({ limit: 10 });
   ```

See `.gpp/CONVENTIONS.md` in your project for detailed patterns.

## Source of Truth
- `.gpp/` is the control plane
- `.gpp/deploy.json` defines enabled platforms and variants
- `.gpp/CONVENTIONS.md` defines code patterns (if present)
- Templates define structure
- gpp CLI defines lifecycle
- `logs/` directory contains project history

## Available GPP Commands

### Project Management
- `gpp init <name> [--recipe <id>] [--with-wizard]` - Create new GPP project
- `gpp add <platform> [variant]` - Add a platform (web, api, cms, mobile, desktop, worker)
- `gpp add route <path> [--static]` - Create a new page/route
- `gpp add api <name>` - Create a domain-specific API module
- `gpp remove <platform> [--yes]` - Remove platform from config
- `gpp delete platform <platform> [--yes]` - Delete platform files
- `gpp convert plan [path]` - Analyze existing project for conversion
- `gpp convert apply [path]` - Convert existing project to GPP structure
- `gpp convert continue [path]` - Resume a partially completed conversion
- `gpp merge plan <source> <target>` - Preview merge of two GPP projects
- `gpp merge apply <source> <target> [--force]` - Merge two GPP projects

### Addons
- `gpp add redis-cache` - Add Redis caching to FastAPI/Express APIs
- `gpp add rate-limit` - Add rate limiting to FastAPI/Express APIs
- `gpp add auth-flows` - Add registration, email verification, password reset
- `gpp add search` - Add Pagefind static search to Next.js projects
- `gpp add supabase` - Add Supabase integration
- `gpp add firebase` - Add Firebase integration
- `gpp add appstore-content` - Add app store listing content
- `gpp add app-landing` - Add app landing page
- `gpp add npm-package` - Add npm package publishing setup
- `gpp add strapi-plugin` - Add Strapi plugin scaffold

### Environment & Config
- `gpp env sync [--only <platform>] [--dry-run]` - Sync environment variables
- `gpp secrets list` - List secrets from configured provider
- `gpp secrets get <key> [--reveal]` - Get a secret value
- `gpp secrets set <key> <value>` - Set a secret
- `gpp secrets sync [--only <platform>]` - Sync secrets to platform .env files
- `gpp secrets provider [type]` - Show or set the default secret provider

### Quality & Git
- `gpp quality gate --before <commit|deploy> [--only <platform>]` - Run quality checks
- `gpp git commit -m "<message>" [--only <platform>] [--force]` - Commit with checks
- `gpp doctor [--all] [--category <cat>]` - Check system health
- `gpp verify [platform] [-v|--verbose]` - Verify GPP project structure

### Logs & Documentation
- `gpp logs install` - Install logging system
- `gpp logs ensure-capacity [--dry-run]` - Archive logs that exceed capacity

### Database
- `gpp db list` - List all databases in project
- `gpp db backup [--workspace <id>] [--keep <n>]` - Backup databases
- `gpp db restore <file>` - Restore from backup file

### CMS Setup
- `gpp cms --setup` - Setup WordPress CMS
- `gpp cms --configure` - Configure WordPress settings
- `gpp strapi --setup` - Setup Strapi CMS

### Templates & Packs
- `gpp template list` - List available templates
- `gpp template install <source>` - Install a template pack
- `gpp template info <id>` - Show template details
- `gpp pack list` - List installed packs
- `gpp pack install <source>` - Install a pack
- `gpp pack update [id]` - Update installed packs

### CI/CD
- `gpp ci generate [--deploy] [--quality]` - Generate GitHub Actions workflows

### IDE Integration
- `gpp ide install [--ide cursor]` - Install IDE configuration files
- `gpp mcp serve` - Start MCP server for Cursor integration

### Other Commands
- `gpp validate <platform> [--strict] [--docker]` - Validate platform
- `gpp admin generate-crud [--force] [--model <name>]` - Generate CRUD pages
- `gpp version list` - List pinned versions
- `gpp version pin <platform>` - Pin platform to version
- `gpp audit list` - List audit entries
- `gpp audit session start <ai-name>` - Start AI session
- `gpp generate frontend [--source <cms>] [--target <framework>]` - Generate frontend from CMS
- `gpp start [platform]` - Start a platform
- `gpp stop [platform]` - Stop a platform
- `gpp restart [platform]` - Restart a platform
- `gpp dev [platform]` - Run platform in development mode
- `gpp build [platform]` - Build a platform
- `gpp log [platform]` - View platform logs

See `.gpp/commands.json` for structured command metadata.