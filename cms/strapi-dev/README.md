# Strapi Development Template

This template provides a Strapi development instance for plugin development. It includes:

- Strapi 5.x with MySQL (TypeScript, Vite)
- Plugin development structure
- Separate ports for isolation (1338, 3001, 3308, 9092)
- Auto-setup scripts
- GraphQL plugin support

## Usage

```bash
gpp add cms strapi-dev
cd apps/cms
./setup.sh
docker compose --env-file .env up -d
```

The first-start script runs automatically once (installs GraphQL plugin if needed). You can also use `./dev.sh` to start containers.

## Features

- **Development Only** - Never goes to production
- **Plugin Ready** - Includes plugin directory structure
- **Isolated Ports** - Separate from production instances
- **Auto-Setup** - Generates .env with secrets automatically

## Ports

- Strapi: 1338
- Frontend: 3001
- MySQL: 3308
- phpMyAdmin: 9092

## Frontend Pairing

This variant pairs with `headless-strapi` Next.js frontend variant.

