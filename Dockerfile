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
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN --mount=type=cache,target=/app/.next/cache \
    --mount=type=cache,target=/app/node_modules/.cache \
    npx next build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apk add --no-cache vips openssl \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
# Standalone trace omits sharp; install Linux binary in runner (npm ci uses --ignore-scripts).
RUN npm install --no-save sharp \
  && chown -R nextjs:nodejs ./node_modules/sharp ./node_modules/@img 2>/dev/null || true \
  && chown -R nextjs:nodejs ./node_modules
ENV NEXT_SHARP_PATH=/app/node_modules/sharp
COPY --chown=nextjs:nodejs scripts/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000

CMD ["./docker-entrypoint.sh"]
