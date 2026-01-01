#!/usr/bin/env bash
set -e

echo "[gpp] Starting Strapi development environment..."

# Check if .env exists
if [ ! -f .env ]; then
  echo "⚠️  .env file not found. Please run ./setup.sh first."
  exit 1
fi

# Start containers
docker compose --env-file .env up -d

echo "✅ Strapi containers started."
echo "   Strapi Admin: http://localhost:${STRAPI_PORT:-1338}/admin"
echo "   Strapi API: http://localhost:${STRAPI_PORT:-1338}/api"
echo "   GraphQL: http://localhost:${STRAPI_PORT:-1338}/graphql"
echo "   phpMyAdmin: http://localhost:${PHPMYADMIN_PORT:-9092}"

