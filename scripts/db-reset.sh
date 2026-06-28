#!/bin/sh
set -e

ROOT_PASS="${MYSQL_ROOT_PASSWORD:-rootpassword}"
DB_NAME="${MYSQL_DATABASE:-medinexplus}"
DB_USER="${MYSQL_USER:-medinex}"

echo "WARNING: This will DELETE ALL DATA in database '$DB_NAME'."
echo "Press Ctrl+C within 5 seconds to cancel..."
sleep 5

echo "Recreating database..."
docker compose exec -T mysql mariadb -uroot -p"$ROOT_PASS" <<SQL
DROP DATABASE IF EXISTS \`$DB_NAME\`;
CREATE DATABASE \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'%';
FLUSH PRIVILEGES;
SQL

echo "Running migrations and seed..."
docker compose run --rm db-init

echo "Done. Database reset complete."
