#!/bin/sh
# Auto-start Strapi with non-interactive mode (GPP: install deps, optional first-start, then develop)

export CI=true
cd /opt/app || exit 1

echo "Installing/updating dependencies for Linux container..."
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

if [ ! -f .gpp-strapi-setup-done ]; then
  echo "[gpp] Running first-start..."
  /usr/local/bin/strapi-first-start.sh
  touch .gpp-strapi-setup-done
fi

printf 'y\n' | npm run develop
