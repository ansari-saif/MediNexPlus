#!/bin/sh
set -e

PRISMA="node ./node_modules/prisma/build/index.js"

echo "Running database migrations..."
attempt=0
while [ "$attempt" -lt 30 ]; do
  output=$($PRISMA migrate deploy 2>&1) && {
    echo "$output"
    echo "Migrations applied."
    break
  }

  echo "$output"

  if echo "$output" | grep -q "P3005"; then
    echo ""
    echo "[db-init] P3005: Database has tables but no Prisma migration history."
    echo "[db-init] This usually means a partial or manual setup."
    echo "[db-init] Fresh setup (deletes all data):  npm run docker:db:reset"
    echo "[db-init] Or on server:                    sh scripts/db-reset.sh"
    exit 1
  fi

  attempt=$((attempt + 1))
  echo "Database not ready, retrying ($attempt/30)..."
  sleep 2
done

if [ "$attempt" -eq 30 ]; then
  echo "Failed to apply migrations after 30 attempts."
  exit 1
fi

echo "Seeding database if empty..."
node prisma/seed.js
