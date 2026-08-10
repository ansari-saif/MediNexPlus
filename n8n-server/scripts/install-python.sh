#!/bin/sh
set -eu

PACKAGES_FILE="${PACKAGES_FILE:-/tmp/n8n-external-packages.json}"
PY_DIR="/opt/runners/task-runner-python"

if [ ! -f "$PACKAGES_FILE" ]; then
  echo "Packages file not found: $PACKAGES_FILE" >&2
  exit 1
fi

packages="$(node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
const list = Array.isArray(data.python) ? data.python.filter(Boolean) : [];
process.stdout.write(list.join(' '));
" "$PACKAGES_FILE")"

if [ -z "$packages" ]; then
  echo "No Python packages to install."
  exit 0
fi

echo "Installing Python packages: $packages"
cd "$PY_DIR"
# Intentional word-splitting: package names are space-separated.
# shellcheck disable=SC2086
uv pip install $packages
