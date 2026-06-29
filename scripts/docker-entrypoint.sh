#!/bin/sh
set -e

if [ -f ./node_modules/prisma/build/index.js ]; then
  echo "Applying database migrations..."
  output=$(node ./node_modules/prisma/build/index.js migrate deploy 2>&1) || {
    echo "$output"
    if echo "$output" | grep -q "P3005"; then
      echo "ERROR: Migration history missing (P3005). Run: sh scripts/db-reset.sh"
      exit 1
    else
      echo "ERROR: Migration failed."
      exit 1
    fi
  }
  if [ -n "$output" ]; then
    echo "$output"
  fi
fi

exec node server.js
