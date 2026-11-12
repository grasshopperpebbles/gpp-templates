# Production image for the BullMQ worker (multi-stage, node:22-slim).
# The final stage has production dependencies and dist/ only.

FROM node:22-slim AS base
WORKDIR /app

FROM base AS build
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM base AS prod-deps
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi \
    && npm cache clean --force

FROM base AS runtime
ENV NODE_ENV=production \
    WORKER_PORT=3099
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
USER node

EXPOSE 3099

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:' + (process.env.WORKER_PORT || 3099) + '/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]

CMD ["node", "dist/index.js"]
