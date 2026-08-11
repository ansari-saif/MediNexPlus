#!/usr/bin/env bash
# Pull latest `work` and rebuild only the web service (mysql/observability stay up).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

IMAGE_PATHS='^(src/|backend/|prisma/|public/|package.json|package-lock.json|Dockerfile|Dockerfile.dev|\.dockerignore|next.config|postcss.config|tailwind.config|tsconfig|src/middleware\.ts|scripts/docker-entrypoint\.sh|scripts/otel-preload\.cjs|scripts/db-init\.sh)'

echo "==> updating ${ROOT} from origin/work"
before="$(git rev-parse HEAD)"
git fetch origin work
git checkout work
git pull --ff-only origin work
after="$(git rev-parse HEAD)"

if [ "${FORCE_WEB_BUILD:-0}" != "1" ] && [ "$before" != "$after" ]; then
  changed="$(git diff --name-only "$before" "$after" || true)"
  if [ -n "$changed" ] && ! echo "$changed" | grep -qE "$IMAGE_PATHS"; then
    echo "==> skipping web rebuild (no image-relevant files)"
    echo "$changed"
    docker compose ps web
    exit 0
  fi
fi

echo "==> building web"
BUILDX_NO_DEFAULT_ATTESTATIONS=1 docker compose build web

echo "==> recreating web (no deps)"
docker compose up -d --no-deps --force-recreate web

echo "==> waiting for health"
for i in $(seq 1 36); do
  status="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' medinexplus 2>/dev/null || echo missing)"
  echo "  web health=${status} (${i}/36)"
  if [ "$status" = "healthy" ]; then
    docker compose ps web
    echo "==> deploy web complete"
    exit 0
  fi
  if [ "$status" = "unhealthy" ] || [ "$status" = "exited" ] || [ "$status" = "dead" ]; then
    break
  fi
  sleep 5
done

echo "==> web failed to become healthy"
docker compose logs --tail=120 web
exit 1
