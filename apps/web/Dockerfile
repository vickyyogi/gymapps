# syntax=docker/dockerfile:1

# Build context is the repository root (npm workspaces): docker build -f apps/web/Dockerfile .
FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN npm ci \
  && npx prisma generate --schema packages/db/prisma/schema.prisma \
  && npm run build -w @gymapps/web

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    CHROME_PATH=/usr/bin/chromium \
    EXPORT_DIR=/data/exports

# chromium renders the monthly PDF (playwright-core drives the system binary).
RUN apt-get update \
  && apt-get install -y --no-install-recommends chromium fonts-liberation ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /data/exports \
  && chown -R node:node /data

COPY --chown=node:node --from=build /app/apps/web/.next/standalone ./
COPY --chown=node:node --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --chown=node:node --from=build /app/apps/web/public ./apps/web/public
COPY --chown=node:node --from=build /app/packages/db/prisma ./prisma
COPY --chown=node:node --from=build /app/node_modules/playwright-core ./node_modules/playwright-core

USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
