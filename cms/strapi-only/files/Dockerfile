FROM node:20-alpine

# Install dependencies
RUN apk add --no-cache \
    curl \
    bash

# Set working directory
WORKDIR /opt/app

# Copy package files
COPY package*.json ./

# Install dependencies
# Use npm install since package-lock.json may not exist yet
# CI=true ensures non-interactive installation
# --legacy-peer-deps handles peer dependency conflicts
RUN CI=true npm install --legacy-peer-deps

# Copy application files (excluding start-strapi.sh which we'll copy separately)
COPY . .

# Copy startup script to /usr/local/bin (not in /opt/app to avoid volume mount override)
COPY start-strapi.sh /usr/local/bin/start-strapi.sh
RUN chmod +x /usr/local/bin/start-strapi.sh

# Expose port
EXPOSE 1337

# Set environment to skip interactive prompts
ENV CI=true

# Start Strapi using the startup script (in /usr/local/bin to avoid volume mount override)
CMD ["/usr/local/bin/start-strapi.sh"]

