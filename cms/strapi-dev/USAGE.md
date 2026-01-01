# Using the Strapi Dev Template

## Overview

The `strapi-dev` template creates a Strapi development instance with:
- Plugin development structure
- Isolated ports (1338, 3001, 3308, 9092)
- Auto-setup scripts
- GraphQL plugin support

## Usage

### Option 1: Using GPP Add Command

```bash
cd /path/to/your/gpp/project
gpp add cms strapi-dev
cd apps/cms
./setup.sh
./dev.sh
```

### Option 2: Manual Setup

1. Copy template files from `templates/cms/strapi-dev/files/` to your project
2. Run `./setup.sh` to generate `.env`
3. Run `./dev.sh` to start containers

## What Gets Created

```
apps/cms/
├── docker-compose.yml
├── Dockerfile
├── package.json
├── setup.sh
├── dev.sh
├── .strapiignore
├── config/
│   ├── database.ts
│   ├── server.ts
│   ├── middlewares.ts
│   └── app.ts
└── src/
    ├── index.ts
    └── plugins/
        └── gpp-strapi-site-builder/
            ├── README.md
            ├── package.json
            └── strapi-admin.js
```

## Environment Variables

The `setup.sh` script generates a `.env` file with:
- Project slug (from project name)
- Strapi secrets (auto-generated)
- Database credentials
- Port configuration
- Admin credentials

## Ports

- **Strapi**: 1338 (configurable via STRAPI_PORT)
- **Frontend**: 3001 (configurable via FRONTEND_URL)
- **MySQL**: 3308 (configurable via MYSQL_PORT)
- **phpMyAdmin**: 9092 (configurable via PHPMYADMIN_PORT)

## Frontend Pairing

This variant pairs with `headless-strapi` Next.js frontend:

```bash
gpp add web headless-strapi
```

Then configure the frontend to connect to Strapi at http://localhost:1338

## Development Workflow

1. **Start Strapi:**
   ```bash
   ./dev.sh
   ```

2. **Access Admin:**
   - Open http://localhost:1338/admin
   - Create first admin user (if first time)

3. **Install GraphQL Plugin:**
   ```bash
   docker compose exec strapi yarn strapi install graphql
   docker compose restart strapi
   ```

4. **Develop Plugin:**
   - Edit files in `src/plugins/gpp-strapi-site-builder/`
   - Strapi will hot-reload changes

5. **Test with Frontend:**
   - Set up `headless-strapi` frontend
   - Connect to http://localhost:1338
   - Test plugin functionality

## Differences from strapi-only

- **Purpose**: Development only (never production)
- **Ports**: Separate ports to avoid conflicts
- **Structure**: Includes plugin development directory
- **Scripts**: Auto-setup script included
- **Isolation**: Designed to run alongside production instances

## Troubleshooting

**Port conflicts:**
- Update ports in `.env` file
- Check for running containers: `docker ps`

**Database errors:**
- Ensure MySQL container is running
- Check credentials in `.env`

**Strapi won't start:**
- Check logs: `docker compose logs strapi`
- Verify `.env` has all required variables
- Ensure APP_KEY is set

## Next Steps

1. Create content types in Strapi admin
2. Develop Site Builder Plugin in `src/plugins/gpp-strapi-site-builder/`
3. Set up frontend for testing
4. Generate production frontend using the plugin

