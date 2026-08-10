# n8n External Task Runners (Custom JS / Python Packages)

Production-oriented setup for n8n **external** task runners with custom Node and Python packages baked into a custom runners image.

Verified with:

- n8n `2.30.8`
- custom image `my-n8n-runners:2.30.8` (from `ghcr.io/n8n-io/runners:latest`)
- packages: `jsonwebtoken` (JS), `pandas` (Python)

---

## Architecture

```
               +------------------+
               |       n8n        |
               |   Task Broker    |
               |   :5679          |
               +--------+---------+
                        |
                   websocket
                        |
       +----------------+----------------+
       |                                 |
+--------------+                 +---------------+
| JS Runner    |                 | Python Runner |
| jsonwebtoken |                 | pandas        |
+--------------+                 +---------------+
         (same container: python-runner)
```

n8n runs in `N8N_RUNNERS_MODE: external`. Code node work is executed by the sidecar runners container, not inside the main n8n process.

---

## Folder layout

```
server/
├── docker-compose.yml              # postgres + n8n + python-runner + promtail
├── Dockerfile                      # extends ghcr.io/n8n-io/runners
├── n8n-task-runners.json           # runner config (allowlists, ports)
├── n8n-external-packages.json      # packages to install at image build
├── add-n8n-package.sh              # add package + rebuild/restart runner (one command)
├── promtail-config.yml             # Promtail → Loki (docker log scrape)
├── observability.md                # logs / metrics / traces setup
├── scripts/
│   ├── install-node.sh             # pnpm add … (build-time)
│   └── install-python.sh           # uv pip install … (build-time)
├── data/                           # n8n volume (created at runtime)
├── postgres/                       # Postgres volume (created at runtime)
└── promtail-data/                  # Promtail positions (gitignored)
```

Observability (Tempo traces, Prometheus metrics, Loki logs): see [`observability.md`](observability.md).

---

## Quick start

```bash
cd server

# 1) Build custom runners image (installs packages from n8n-external-packages.json)
docker compose build python-runner

# 2) Start stack
docker compose up -d

# 3) Check health + registration
curl -s http://localhost:5678/healthz
docker compose logs n8n | grep -E 'Registered runner|Task Broker'
```

Expected in n8n logs:

```
n8n Task Broker ready on 0.0.0.0, port 5679
Registered runner "launcher-python" (...)
Registered runner "launcher-javascript" (...)
```

UI: [http://localhost:5678](http://localhost:5678)

---

## Adding packages

One command — updates the manifest, then rebuilds and restarts the runner:

```bash
cd server
./add-n8n-package.sh --node <package>
./add-n8n-package.sh --python <package>
```

Examples:

```bash
./add-n8n-package.sh --node jsonwebtoken
./add-n8n-package.sh --python pandas
```

What it does:

1. Adds the package to `n8n-external-packages.json`
2. Updates `n8n-task-runners.json` allowlists when they are **not** `"*"`
3. Runs `docker compose up -d python-runner --build`

Packages are installed at **image build time** inside that last step. No separate rebuild command needed.

### Manifest format

`n8n-external-packages.json`:

```json
{
  "node": ["jsonwebtoken"],
  "python": ["pandas"]
}
```

---

## How the custom image works

`Dockerfile`:

1. Starts from `ghcr.io/n8n-io/runners:latest`
2. Copies `n8n-task-runners.json` → `/etc/n8n-task-runners.json`
3. Copies package manifest + install scripts
4. Runs `install-node.sh` (`pnpm add` in `/opt/runners/task-runner-javascript`)
5. Runs `install-python.sh` (`uv pip install` in `/opt/runners/task-runner-python`)
6. Drops back to `USER runner`

Notes:

- `install-node.sh` pins **pnpm 10.32.1** via corepack. The base image’s `node_modules` were built with pnpm 10; pnpm 11 fails with `ERR_PNPM_UNEXPECTED_STORE`.
- Do **not** `docker exec` and `pnpm add` / `pip install` on a running container. Rebuild the image instead.

---

## Runner allowlists

`n8n-task-runners.json` controls what Code nodes may import.

Current config is open:

| Runner | Env | Value |
|--------|-----|-------|
| javascript | `NODE_FUNCTION_ALLOW_BUILTIN` | `*` |
| javascript | `NODE_FUNCTION_ALLOW_EXTERNAL` | `*` |
| javascript | `N8N_RUNNERS_INSECURE_MODE` | `true` (needed for libs that mutate prototypes, e.g. `dayjs`) |
| python | `N8N_RUNNERS_STDLIB_ALLOW` | `*` |
| python | `N8N_RUNNERS_EXTERNAL_ALLOW` | `*` |

`N8N_RUNNERS_INSECURE_MODE=true` relaxes JS runner sandboxing so packages that patch prototypes can load. With insecure mode, also omit Node flags `--disallow-code-generation-from-strings` and `--disable-proto=delete` from the JS runner `args` (they block libs like `dayjs`). Prefer keeping insecure mode only if you need such libraries.

For tighter production allowlists, replace `*` with comma-separated names, e.g. `jsonwebtoken` / `pandas,numpy`. The config is **baked into the image** at build time (no runtime volume mount).

---

## docker-compose highlights

| Service | Image / build | Role |
|---------|---------------|------|
| `postgres` | `postgres:14` | n8n DB |
| `n8n` | `n8nio/n8n:2.30.8` | main app + task broker `:5679` |
| `python-runner` | build `Dockerfile` → `my-n8n-runners:2.30.8` | JS + Python runners |

Important n8n env:

```yaml
N8N_RUNNERS_MODE: external
N8N_RUNNERS_AUTH_TOKEN: <shared-secret>
N8N_RUNNERS_BROKER_LISTEN_ADDRESS: 0.0.0.0
N8N_PYTHON_ENABLED: true
```

Important runner env:

```yaml
N8N_RUNNERS_TASK_BROKER_URI: http://n8n:5679
N8N_RUNNERS_AUTH_TOKEN: <same-shared-secret>
```

Keep the auth token identical on both services.

---

## Verify packages inside the runner

```bash
docker compose exec python-runner sh -c '
cd /opt/runners/task-runner-javascript && \
  node -e "console.log(require.resolve(\"jsonwebtoken\"))"

/opt/runners/task-runner-python/.venv/bin/python -c \
  "import pandas as pd; print(pd.__version__)"
'
```

### Code node smoke tests

JavaScript:

```javascript
const jwt = require("jsonwebtoken");
return [{ token: jwt.sign({ hello: "world" }, "secret") }];
```

Python:

```python
import pandas as pd
return [{"rows": len(pd.DataFrame([1, 2, 3]))}]
```

---

## Day-to-day commands

```bash
# Start / stop
docker compose up -d
docker compose down

# Logs
docker compose logs -f n8n
docker compose logs -f python-runner

# Add a package (rebuilds + restarts runner automatically)
./add-n8n-package.sh --node lodash
./add-n8n-package.sh --python openpyxl
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `Cannot find module '…'` in Code node | Package not in image | `./add-n8n-package.sh --node|--python <pkg>` |
| `ERR_PNPM_UNEXPECTED_STORE` on build | Wrong pnpm major | Keep `corepack prepare pnpm@10.32.1` in `install-node.sh` |
| Runners not registering | Broker/auth mismatch or n8n not ready | Match `N8N_RUNNERS_AUTH_TOKEN`; check broker on `:5679`; restart `python-runner` |
| `Python runner unavailable` | Runner container down or wrong mode | Ensure `N8N_RUNNERS_MODE=external` and runner is up |
| Package works in `docker exec` but not Code node | Allowlist missing | Set package (or `*`) in `n8n-task-runners.json`, rebuild |

---

## Things not to do

- Don’t use Internal mode in production for untrusted Code node work.
- Don’t install packages with `docker exec` into a live container.
- Don’t use `npm install -g`.
- Don’t mount host `node_modules` into the runner.
- Prefer aligning runner base tag with your n8n version when a matching tag exists (avoids version skew vs `:latest`).

---

## References

- [n8n Task runners docs](https://docs.n8n.io/hosting/configuration/task-runners/)
- [n8nio/runners on Docker Hub](https://hub.docker.com/r/n8nio/runners)
