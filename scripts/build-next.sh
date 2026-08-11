#!/usr/bin/env bash
# Incremental Next.js production build using a persistent node_modules volume
# and host .next (gitignored). Docker image builds do not get a real incremental
# compile because each RUN is a fresh container.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BUILDER_IMAGE="${NEXT_BUILDER_IMAGE:-medinexplus-next-builder}"
NM_VOLUME="${NEXT_NM_VOLUME:-medinexplus-web-nm}"

if ! docker image inspect "$BUILDER_IMAGE" >/dev/null 2>&1; then
  echo "==> building ${BUILDER_IMAGE}"
  docker build -t "$BUILDER_IMAGE" - <<'EOF'
FROM node:20-bookworm-slim
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
EOF
fi

docker volume create "$NM_VOLUME" >/dev/null

echo "==> next build (persistent .next + node_modules)"
docker run --rm \
  -v "$ROOT:/app" \
  -v "${NM_VOLUME}:/app/node_modules" \
  -w /app \
  -e NEXT_TELEMETRY_DISABLED=1 \
  -e SKIP_DOCKER_TYPECHECK=1 \
  -e NEXT_UNOPTIMIZED_IMAGES=1 \
  -e NODE_OPTIONS=--max-old-space-size=8192 \
  "$BUILDER_IMAGE" \
  bash -lc '
    set -euo pipefail
    lock_hash=$(sha256sum package-lock.json | awk "{print \$1}")
    stamp="${lock_hash}:dev"
    if [ ! -x node_modules/.bin/next ] || [ ! -f node_modules/.lockhash ] || [ "$(cat node_modules/.lockhash)" != "$stamp" ]; then
      echo "==> npm ci (including devDependencies for @/ path aliases)"
      NPM_CONFIG_PRODUCTION=false npm ci --ignore-scripts --include=dev
      npx prisma generate
      echo "$stamp" > node_modules/.lockhash
    fi
    export NODE_ENV=production
    npx next build
    rm -rf deploy-out
    mkdir -p deploy-out/standalone deploy-out/static
    cp -a .next/standalone/. deploy-out/standalone/
    cp -a .next/static/. deploy-out/static/
    mkdir -p deploy-out/standalone/node_modules/.prisma \
             deploy-out/standalone/node_modules/@prisma \
             deploy-out/standalone/node_modules/prisma
    cp -a node_modules/.prisma/. deploy-out/standalone/node_modules/.prisma/ 2>/dev/null || true
    cp -a node_modules/@prisma/. deploy-out/standalone/node_modules/@prisma/
    cp -a node_modules/prisma/. deploy-out/standalone/node_modules/prisma/
  '
