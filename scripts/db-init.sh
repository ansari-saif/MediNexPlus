#!/bin/sh
set -e

echo "Running database migrations..."
attempt=0
while [ "$attempt" -lt 30 ]; do
  if node ./node_modules/prisma/build/index.js migrate deploy; then
    echo "Migrations applied."
    break
  fi
  attempt=$((attempt + 1))
  echo "Database not ready, retrying ($attempt/30)..."
  sleep 2
done

if [ "$attempt" -eq 30 ]; then
  echo "Failed to apply migrations."
  exit 1
fi

echo "Seeding database if empty..."
node prisma/seed.js
