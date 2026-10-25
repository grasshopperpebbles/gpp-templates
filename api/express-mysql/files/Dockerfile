# Production image for the Express API (multi-stage, node:22-slim).
# The final stage has only production dependencies, the compiled dist/ and the
# Prisma schema + migrations; tests and devDependencies stay in the build stage.

FROM node:22-slim AS base
# Prisma's query and schema engines need OpenSSL; slim does not ship it.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- build: all deps, prisma generate, compile TypeScript --------------------
FROM base AS build
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- prod-deps: runtime node_modules only (postinstall runs prisma generate) -
FROM base AS prod-deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi \
    && npm cache clean --force

# ---- runtime -----------------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production \
    API_PORT=3001
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
COPY --chown=node:node prisma ./prisma
# Non-root: the official image's "node" user (uid 1000).
USER node

EXPOSE 3001

# slim has no curl: probe /health with Node's built-in fetch.
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:' + (process.env.API_PORT || 3001) + '/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]

# Migrations are not run automatically. Apply them with:
#   docker compose exec <slug>-api npx prisma migrate deploy
CMD ["node", "dist/server.js"]
