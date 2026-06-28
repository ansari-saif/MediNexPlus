#!/bin/sh
set -e

if [ -f ./node_modules/prisma/build/index.js ]; then
  echo "Applying database migrations..."
  node ./node_modules/prisma/build/index.js migrate deploy
fi

exec node server.js
