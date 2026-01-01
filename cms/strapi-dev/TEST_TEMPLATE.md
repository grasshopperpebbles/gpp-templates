# Testing the Strapi Dev Template

## Template Created ✅

The `strapi-dev` template has been created at:
`templates/cms/strapi-dev/`

## Files Included

- `variant.json` - Template metadata
- `files/docker-compose.yml` - Docker configuration
- `files/Dockerfile` - Strapi container
- `files/package.json` - Dependencies
- `files/setup.sh` - Auto-setup script
- `files/dev.sh` - Development startup
- `files/config/` - Strapi configuration files
- `files/src/plugins/gpp-strapi-site-builder/` - Plugin structure
- `README.md` - Template documentation

## Testing Steps

### 1. Build GPP CLI

```bash
cd /Users/lesliegreen/projects/gpp-cli
npm run build
```

### 2. Test Template Scaffolding

```bash
cd /Users/lesliegreen/projects/grasshopperpebbles-io

# Remove old test directory
rm -rf apps/strapi-dev-test

# Use GPP to scaffold
gpp add cms strapi-dev
```

This should:
- Create `apps/cms/` directory
- Copy all template files
- Set up the structure

### 3. Verify Files

```bash
cd apps/cms
ls -la
# Should see: docker-compose.yml, Dockerfile, package.json, setup.sh, dev.sh, config/, src/
```

### 4. Run Setup

```bash
./setup.sh
```

This should:
- Generate `.env` file
- Create all required secrets

### 5. Start Strapi

```bash
./dev.sh
```

This should:
- Start Docker containers
- Make Strapi available at http://localhost:1338

### 6. Verify Installation

```bash
# Check containers
docker compose --env-file .env ps

# Check health
curl http://localhost:1338/_health

# Access admin
open http://localhost:1338/admin
```

## Expected Results

✅ All template files copied
✅ `.env` generated with secrets
✅ Docker containers start successfully
✅ Strapi admin panel accessible
✅ Plugin directory structure present

## Comparison with Original

The template should recreate the same structure as the original `apps/strapi-dev/`:
- Same Docker configuration
- Same Strapi setup
- Same plugin structure
- Same scripts

## Next Steps After Testing

1. If successful, the template is ready for use
2. Update documentation if needed
3. Consider adding to default variants list
4. Test with different project names/slugs

