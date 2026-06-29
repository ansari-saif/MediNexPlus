# Observability Stack — Deployment Guide

Self-hosted Grafana observability for MediNexPlus: **logs (Loki), traces (Tempo), metrics (Prometheus), and continuous profiles (Pyroscope)**, visualized in **Grafana**. All telemetry stays on the internal Docker network — no external egress.

---

## 1. Architecture

```
web (Next.js) ──OTLP──> alloy ──> loki / tempo / prometheus
            └──profiles──> pyroscope
mysql ──> mysqld-exporter ──> prometheus
grafana <── loki / tempo / prometheus / pyroscope   (UI on 127.0.0.1:3001)
```

| Service | Image | Role |
|---------|-------|------|
| `alloy` | `grafana/alloy` | OTLP gateway (receives logs/traces/metrics from the app) |
| `loki` | `grafana/loki:3.4.2` | Log storage |
| `tempo` | `grafana/tempo:2.7.1` | Trace storage |
| `prometheus` | `prom/prometheus:v3.2.1` | Metrics storage + scraping |
| `pyroscope` | `grafana/pyroscope` | Continuous CPU/memory profiling |
| `mysqld-exporter` | `prom/mysqld-exporter` | MySQL metrics |
| `grafana` | `grafana/grafana` | Dashboards (bound to `127.0.0.1:3001`) |

All observability services live behind the Docker Compose `observability` profile, so the base app (`web`, `mysql`) can run without them.

---

## 2. Prerequisites

- Docker + Docker Compose v2 on the server
- `.env` present with app secrets (`JWT_SECRET`, `DATABASE_URL`, MySQL creds, etc.)
- Recommended: set a Grafana admin password in `.env`:

```bash
GRAFANA_ADMIN_PASSWORD=your-strong-password
```

> If unset, Grafana defaults to `admin` / `admin`. Grafana is bound to `127.0.0.1` only, so it is not publicly reachable, but set a real password for production.

---

## 3. Deploy

### Toggle

Observability is controlled by **two** switches that must agree:

| Switch | Purpose |
|--------|---------|
| `OTEL_ENABLED=1` | App emits telemetry (OTel SDK + Pyroscope start) |
| `--profile observability` | Brings up Alloy/Loki/Tempo/Prometheus/Pyroscope/Grafana |

The npm scripts wire both together:

```bash
# Build + start app WITH the full observability stack
npm run docker:prod:obs       # OTEL_ENABLED=1 docker compose --profile observability up -d --build

# Start (no rebuild) with observability
npm run docker:obs            # OTEL_ENABLED=1 docker compose --profile observability up -d

# Base app only (telemetry no-ops, stack not started)
npm run docker:prod
```

### On the server

```bash
cd /root/MediNexPlus
git pull --ff-only origin main
OTEL_ENABLED=1 BUILDX_NO_DEFAULT_ATTESTATIONS=1 \
  docker compose --profile observability up -d --build
```

---

## 4. Access Grafana (SSH tunnel)

Grafana is intentionally bound to `127.0.0.1:3001` (not public). Tunnel in:

```bash
ssh -L 3001:127.0.0.1:3001 root@<server-ip>
# then open http://localhost:3001
```

Datasources (Loki, Tempo, Prometheus, Pyroscope) and starter dashboards are auto-provisioned.

---

## 5. Verify

```bash
# App healthy
curl http://localhost:3000/api/health

# Metrics endpoint (internal only)
curl http://localhost:3000/api/metrics | head

# Containers up
docker compose --profile observability ps
```

In Grafana, after generating some traffic:

- **Prometheus** → `http_requests_total`, `http_request_duration_seconds`, `db_query_duration_seconds`
- **Loki** → structured JSON logs with `trace_id` correlation
- **Tempo** → traces for `/api/*` requests
- **Pyroscope** → flame graph for `medinexplus-web` (after ~60s of traffic)

---

## 6. Build gotcha — why the first deploy failed

Pyroscope pulls in `@datadog/pprof`, which uses Node-only modules (`fs`, `path`, `worker_threads`). During `next build`, webpack tried to bundle this chain via the instrumentation hook and failed:

```
Module not found: Can't resolve 'fs'
  @datadog/pprof → @pyroscope/nodejs → src/lib/observability/register.ts → src/instrumentation.ts
```

**Fix (already in the repo):**

1. `src/instrumentation.ts` only loads the register module in the Node runtime:

   ```ts
   export async function register() {
     if (process.env.OTEL_ENABLED !== "1") return;
     if (process.env.NEXT_RUNTIME !== "nodejs") return;
     await import("./lib/observability/register");
   }
   ```

2. `next.config.mjs` marks the native packages as external so webpack does not bundle them:

   ```js
   experimental: {
     instrumentationHook: true,
     serverComponentsExternalPackages: [
       "@opentelemetry/sdk-node",
       "@opentelemetry/auto-instrumentations-node",
       "@opentelemetry/instrumentation",
       "@pyroscope/nodejs",
       "@datadog/pprof",
       "require-in-the-middle",
       "import-in-the-middle",
       "pino",
     ],
   }
   ```

If you add more Node-native instrumentation packages, add them to `serverComponentsExternalPackages` too.

---

## 7. PHI safety (healthcare)

- Logs redact PHI keys (name, phone, email, patientId, diagnosis, password, token, etc.) via `backend/utils/logger.ts`.
- Metric labels are low-cardinality only (`route`, `method`, `status`, `role`, `model`, `operation`, `provider`, `feature`, `result`) — never `patientId`, `hospitalId`, `billId`, or `email`.
- `/api/metrics` is restricted to internal/loopback callers; do not expose it via the public reverse proxy.

---

## 8. Troubleshooting

| Symptom | Cause / Fix |
|---------|-------------|
| `Module not found: Can't resolve 'fs'` during build | Native pkg not externalized — add it to `serverComponentsExternalPackages` |
| `Can't resolve '.../backend/utils/api-route'` | Partial deploy — ensure `backend/utils/api-route.ts` + `logger.ts` are present (full commit pulled) |
| Grafana shows no data | Confirm `OTEL_ENABLED=1` AND `--profile observability`; check `docker logs medinexplus-alloy` |
| Pyroscope empty | Needs ~60s of live traffic; confirm `PYROSCOPE_SERVER_ADDRESS=http://pyroscope:4040` |
| Prometheus target down | Check `web:3000/api/metrics` and `mysqld-exporter:9104` reachability inside the compose network |

---

## 9. Deploy notes / state

- The observability code must deploy **as a whole**: app instrumentation (`instrumentation.ts`, `src/lib/observability/`), shared utils (`backend/utils/api-route.ts`, `logger.ts`), the `observability/` configs, and the OTEL/pino deps in `package.json`. Partial copies break the build.
- Any pre-existing uncommitted server work should be committed or stashed before pulling, to avoid mixed states. (A `git stash` backup named `server-local-work-backup-*` may exist on the server holding earlier feature work — review and reapply it separately.)
