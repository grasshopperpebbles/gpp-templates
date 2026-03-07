#!/usr/bin/env bash
set -e
echo "[gpp] Strapi first-start: installing GraphQL plugin if needed..."
cd /opt/app
if ! grep -q "@strapi/plugin-graphql" package.json 2>/dev/null; then
  npm install @strapi/plugin-graphql --save --legacy-peer-deps 2>/dev/null || true
fi
echo "[gpp] Strapi first-start done."
