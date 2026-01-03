#!/bin/sh
# Auto-start Strapi with non-interactive mode
# This script handles the dependency prompt automatically

# Set non-interactive environment
export CI=true

# Change to app directory
cd /opt/app || exit 1

# Always reinstall dependencies to ensure Linux-compatible binaries (volume mount may have macOS binaries)
echo "Installing/updating dependencies for Linux container..."
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Start Strapi, auto-answering 'y' to any prompts
# Using printf to send 'y' followed by newline, then pipe to npm
printf 'y\n' | npm run develop

