#!/usr/bin/env bash
set -e

echo "[gpp] Starting Strapi development environment..."

# Check if .env exists
if [ ! -f .env ]; then
  echo "⚠️  .env file not found. Please run 'gpp strapi setup' first."
  exit 1
fi

# Start containers
docker compose --env-file .env up -d

echo "✅ Strapi containers started."
echo "   Strapi Admin: http://localhost:${STRAPI_PORT:-1337}/admin"
echo "   Strapi API: http://localhost:${STRAPI_PORT:-1337}/api"
echo "   phpMyAdmin: http://localhost:${PHPMYADMIN_PORT:-9091}"

