# Strapi CMS Template

A Strapi 5 headless CMS with Docker, MySQL and phpMyAdmin.

## Features

- **Strapi 5.x** with TypeScript and Vite
- **MySQL 8.0** database
- **phpMyAdmin** for database management
- **REST API** built in
- **GraphQL** plugin installed and enabled (`config/plugins.ts`)
- **Docker Compose** stack, container names prefixed with `PROJECT_SLUG`

## Setup

1. Add the CMS platform with the Strapi variant:
   ```bash
   gpp add cms strapi-only
   ```

2. Run the Strapi setup:
   ```bash
   gpp strapi setup
   ```

3. Open Strapi:
   - Admin panel: http://localhost:1337/admin
   - REST API: http://localhost:1337/api
   - GraphQL: http://localhost:1337/graphql

## What gets created

- `.env` - environment variables for Strapi and Docker
- `docker-compose.yml` - MySQL, Strapi and phpMyAdmin services
- `package.json` - Strapi dependencies
- `Dockerfile` - Strapi container image
- `config/` - Strapi configuration (`plugins.ts.example` shows S3 and Cloudinary upload provider config)
- `scripts/strapi-first-start.sh` - runs once on first container start (installs GraphQL if missing)

## Development

Start the stack:
```bash
docker compose --env-file .env up -d
```

Or use the helper:
```bash
./dev.sh
```

View logs:
```bash
docker compose logs -f strapi
```

## Environment variables

Key variables in `.env`:
- `PROJECT_SLUG` - prefix for container and image names (required)
- `STRAPI_PORT` - host port for Strapi (default 1337)
- `MYSQL_PORT` - host port for MySQL (default 3307)
- `PHPMYADMIN_PORT` - host port for phpMyAdmin (default 9091)
- `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD` - database credentials

## Database management

phpMyAdmin runs at http://localhost:9091 (or `PHPMYADMIN_PORT`). Server `db`, user `root`, password from `MYSQL_ROOT_PASSWORD` in `.env`.

## Adding plugins

Install a plugin in the Strapi container, then enable it in `config/plugins.ts` and restart:
```bash
docker compose exec strapi npm install <plugin-package>
docker compose restart strapi
```

## API authentication

Create an API token in the admin panel (Settings > API Tokens) and set `STRAPI_API_TOKEN` in your Next.js `.env.local`.

## Troubleshooting

**Strapi won't start:** check `docker compose logs strapi`, `docker compose ps`, and that `.env` has every required variable.

**Database connection errors:** make sure the `db` container is running and the credentials in `.env` match; check `docker compose logs db`.

**Port conflicts:** change the ports in `.env`.
