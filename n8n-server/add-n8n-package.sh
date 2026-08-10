#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGES_FILE="${SCRIPT_DIR}/n8n-external-packages.json"
RUNNERS_JSON="${SCRIPT_DIR}/n8n-task-runners.json"

usage() {
  cat <<'EOF'
Usage:
  ./add-n8n-package.sh --node <package>
  ./add-n8n-package.sh --python <package>

Examples:
  ./add-n8n-package.sh --node jsonwebtoken
  ./add-n8n-package.sh --python pandas

Adds the package to n8n-external-packages.json, updates the allowlist
in n8n-task-runners.json (when it is not already "*"), then rebuilds
and restarts the runners container:
  docker compose up -d python-runner --build
EOF
  exit 1
}

RUNTIME=""
PACKAGE=""

while [ $# -gt 0 ]; do
  case "$1" in
    --node)
      RUNTIME="node"
      PACKAGE="${2:-}"
      shift 2
      ;;
    --python)
      RUNTIME="python"
      PACKAGE="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      ;;
  esac
done

if [ -z "$RUNTIME" ] || [ -z "$PACKAGE" ]; then
  usage
fi

if [ ! -f "$PACKAGES_FILE" ]; then
  cat >"$PACKAGES_FILE" <<'EOF'
{
  "node": [],
  "python": []
}
EOF
fi

PACKAGES_FILE="$PACKAGES_FILE" \
RUNNERS_JSON="$RUNNERS_JSON" \
RUNTIME="$RUNTIME" \
PACKAGE="$PACKAGE" \
node <<'EOF'
const fs = require('fs');

const packagesFile = process.env.PACKAGES_FILE;
const runnersFile = process.env.RUNNERS_JSON;
const runtime = process.env.RUNTIME;
const pkg = process.env.PACKAGE;

const packages = JSON.parse(fs.readFileSync(packagesFile, 'utf8'));
if (!Array.isArray(packages.node)) packages.node = [];
if (!Array.isArray(packages.python)) packages.python = [];

const list = packages[runtime];
if (list.includes(pkg)) {
  console.log(`Package already listed (${runtime}): ${pkg}`);
} else {
  list.push(pkg);
  list.sort((a, b) => a.localeCompare(b));
  fs.writeFileSync(packagesFile, JSON.stringify(packages, null, 2) + '\n');
  console.log(`Added to n8n-external-packages.json (${runtime}): ${pkg}`);
}

const allowKey =
  runtime === 'node' ? 'NODE_FUNCTION_ALLOW_EXTERNAL' : 'N8N_RUNNERS_EXTERNAL_ALLOW';
const runnerType = runtime === 'node' ? 'javascript' : 'python';

if (!fs.existsSync(runnersFile)) {
  console.log(`Skip allowlist update: ${runnersFile} not found`);
} else {
  const runners = JSON.parse(fs.readFileSync(runnersFile, 'utf8'));
  const runner = (runners['task-runners'] || []).find((r) => r['runner-type'] === runnerType);
  if (!runner) {
    console.log(`Skip allowlist update: no ${runnerType} runner in ${runnersFile}`);
  } else {
    runner['env-overrides'] = runner['env-overrides'] || {};
    const current = String(runner['env-overrides'][allowKey] ?? '').trim();

    if (current === '*') {
      console.log(`Allowlist already open (${allowKey}=*): no change`);
    } else {
      const items = current
        ? current.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      if (items.includes(pkg)) {
        console.log(`Already allowlisted (${allowKey}): ${pkg}`);
      } else {
        items.push(pkg);
        runner['env-overrides'][allowKey] = items.join(',');
        fs.writeFileSync(runnersFile, JSON.stringify(runners, null, 2) + '\n');
        console.log(`Updated ${allowKey} in n8n-task-runners.json: ${pkg}`);
      }
    }
  }
}
EOF

echo
echo "Rebuilding and restarting python-runner..."
cd "$SCRIPT_DIR"
docker compose up -d python-runner --build

echo
echo "Done. Package '${PACKAGE}' (${RUNTIME}) is ready after the runner comes up."
