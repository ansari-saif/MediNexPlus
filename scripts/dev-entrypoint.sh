#!/bin/sh
set -e
./scripts/db-init.sh
echo "Starting Next.js dev server..."
exec npm run dev
