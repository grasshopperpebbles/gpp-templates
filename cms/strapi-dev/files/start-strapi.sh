#!/bin/sh
# Auto-start Strapi with non-interactive mode (GPP: install deps if needed, optional first-start, then develop)

export CI=true
cd /opt/app || exit 1

# node_modules lives in the strapi_data volume (Linux-only, never the host's). The image build installs
# it and writes this stamp, so a start installs again only when package.json or the lockfile changed.
STAMP=node_modules/.gpp-deps-stamp
deps_hash() { cat package.json package-lock.json 2>/dev/null | sha256sum | cut -d' ' -f1; }

if [ ! -d node_modules ] || [ "$(cat "$STAMP" 2>/dev/null)" != "$(deps_hash)" ]; then
  echo "Installing dependencies for the Linux container..."
  npm install --legacy-peer-deps || exit 1
  deps_hash > "$STAMP"
else
  echo "Dependencies are up to date."
fi

if [ ! -f .gpp-strapi-setup-done ]; then
  echo "[gpp] Running first-start..."
  /usr/local/bin/strapi-first-start.sh
  touch .gpp-strapi-setup-done
fi

printf 'y\n' | npm run develop
