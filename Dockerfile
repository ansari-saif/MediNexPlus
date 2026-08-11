# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts \
  && npm rebuild sharp
COPY prisma ./prisma
COPY scripts/db-init.sh ./scripts/db-init.sh
RUN chmod +x ./scripts/db-init.sh \
  && npx prisma generate

FROM deps AS migrate
CMD ["./scripts/db-init.sh"]

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV SKIP_DOCKER_TYPECHECK=1
ENV NEXT_UNOPTIMIZED_IMAGES=1
ENV NODE_OPTIONS="--max-old-space-size=8192"
# Persist webpack cache + previous .next/server so a one-file change does not
# cold-compile the whole app. Cache mounts are not in the image; copy out after.
RUN --mount=type=cache,target=/app/.next/cache \
    --mount=type=cache,id=medinexplus-next-server,target=/opt/next-server \
    --mount=type=cache,target=/app/node_modules/.cache \
    set -e; \
    mkdir -p .next; \
    if [ -d /opt/next-server/server ]; then \
      echo "==> restoring incremental .next/server"; \
      cp -a /opt/next-server/server .next/server; \
      find /opt/next-server -maxdepth 1 -name '*.json' -exec cp -a {} .next/ \;; \
    else \
      echo "==> cold Next.js build (no server cache yet)"; \
    fi; \
    npx next build; \
    rm -rf /opt/next-server/server; \
    mkdir -p /opt/next-server; \
    cp -a .next/server /opt/next-server/server; \
    find .next -maxdepth 1 -name '*.json' -exec cp -a {} /opt/next-server/ \;

# Generate Prisma Client on Debian (same libc/OpenSSL as the runtime container).
FROM node:20-bookworm-slim AS prisma-runner
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts && npx prisma generate

FROM node:20-bookworm-slim AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=prisma-runner --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=prisma-runner --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=prisma-runner --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs scripts/docker-entrypoint.sh ./docker-entrypoint.sh
COPY --chown=nextjs:nodejs scripts/otel-preload.cjs ./scripts/otel-preload.cjs
RUN chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000

CMD ["./docker-entrypoint.sh"]
