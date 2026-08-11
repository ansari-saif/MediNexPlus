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

echo "==> building web (incremental Next cache; not a cold rebuild of the whole app)"
BUILDX_NO_DEFAULT_ATTESTATIONS=1 docker compose build web

echo "==> recreating web (no deps)"
docker compose up -d --no-deps --force-recreate web

echo "==> waiting for HTTP health"
for i in $(seq 1 30); do
  if curl -sf http://127.0.0.1:3000/api/health >/dev/null; then
    docker compose ps web
    echo "==> deploy web complete"
    exit 0
  fi
  state="$(docker inspect --format='{{.State.Status}}' medinexplus 2>/dev/null || echo missing)"
  echo "  waiting health (${i}/30) container=${state}"
  if [ "$state" = "exited" ] || [ "$state" = "dead" ] || [ "$state" = "missing" ]; then
    break
  fi
  sleep 2
done

echo "==> web failed to become healthy"
docker compose logs --tail=120 web
exit 1
