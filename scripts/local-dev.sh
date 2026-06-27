#!/bin/sh
set -e

cd "$(dirname "$0")/.."

echo "→ Starting MySQL (Docker)..."
docker compose -f docker-compose.db.yml up -d

echo "→ Waiting for MySQL..."
until docker compose -f docker-compose.db.yml exec -T mysql \
  mysqladmin ping -h 127.0.0.1 -u root -p"${MYSQL_ROOT_PASSWORD:-rootpassword}" --silent 2>/dev/null; do
  sleep 2
done

echo "→ Migrations + seed..."
npx prisma migrate deploy
node prisma/seed.js

echo "→ Dev server: http://localhost:3000"
echo "   Login: admin@hospital.com / Medinex@123"
exec npm run dev
