#!/bin/sh
set -eu

PACKAGES_FILE="${PACKAGES_FILE:-/tmp/n8n-external-packages.json}"
JS_DIR="/opt/runners/task-runner-javascript"

if [ ! -f "$PACKAGES_FILE" ]; then
  echo "Packages file not found: $PACKAGES_FILE" >&2
  exit 1
fi

packages="$(node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
const list = Array.isArray(data.node) ? data.node.filter(Boolean) : [];
process.stdout.write(list.join(' '));
" "$PACKAGES_FILE")"

if [ -z "$packages" ]; then
  echo "No Node packages to install."
  exit 0
fi

echo "Installing Node packages: $packages"
cd "$JS_DIR"

# Base image was built with pnpm 10; corepack defaults to a newer major
# that refuses the existing store layout.
corepack prepare pnpm@10.32.1 --activate

# Intentional word-splitting: package names are space-separated.
# shellcheck disable=SC2086
pnpm add $packages
