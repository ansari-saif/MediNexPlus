# n8n Observability (Logs, Metrics, Traces)

Wiring for the `server/` Docker Compose stack against alt-mobility backends:

| Signal | Path | Backend |
|--------|------|---------|
| Traces | n8n OTLP HTTP | `https://tempo.alt-mobility.com` |
| Metrics | Prometheus scrape of `/metrics` | Grafana Prometheus |
| Logs | Docker logs → Promtail | `https://loki.alt-mobility.com` |

```
n8n ──OTLP──► Tempo
n8n ──/metrics◄── Grafana Prometheus (pull)
n8n / python-runner / postgres
       │ Docker logs
       ▼
    Promtail ──push──► Loki
```

---

## Traces (OpenTelemetry → Tempo)

Set on the `n8n` service in [`docker-compose.yml`](docker-compose.yml):

```yaml
N8N_OTEL_ENABLED: "true"
N8N_OTEL_EXPORTER_OTLP_ENDPOINT: "https://tempo.alt-mobility.com"
N8N_OTEL_EXPORTER_SERVICE_NAME: "n8n"
N8N_OTEL_TRACES_INCLUDE_NODE_SPANS: "true"
N8N_OTEL_TRACES_PRODUCTION_ONLY: "false"
```

**Base URL only.** n8n uses `N8N_OTEL_*` (not bare `OTEL_EXPORTER_OTLP_ENDPOINT`) and appends `/v1/traces`. Do **not** set the endpoint to `.../v1/traces` or requests become `.../v1/traces/v1/traces`.

Optional auth (if Tempo requires it later):

```yaml
N8N_OTEL_EXPORTER_OTLP_HEADERS: "Authorization=Bearer <token>"
```

Verify in Grafana Explore (Tempo): `service.name = n8n` after running a workflow.

**Startup warning:** n8n may log `Failed to connect to OpenTelemetry OTLP endpoint during startup` if Tempo answers the probe with a non-success GET (e.g. `405 Method Not Allowed` on `/v1/traces`). That is often harmless — OTLP export uses **POST**, and Tempo accepts those (`200` from this stack). Confirm with a real workflow execution in Grafana Tempo, not the startup line alone.

---

## Metrics (Prometheus → Grafana)

Enabled on n8n:

```yaml
N8N_METRICS: "true"
N8N_METRICS_INCLUDE_DEFAULT_METRICS: "true"
N8N_METRICS_INCLUDE_WEBHOOK_METRICS: "true"
N8N_METRICS_INCLUDE_WORKFLOW_INFO: "true"
N8N_METRICS_INCLUDE_SCHEDULER_METRICS: "true"
```

The extra `INCLUDE_*` flags power the [n8n-observability](https://github.com/n8n-io/n8n-observability) Grafana panels (webhook path latency, `n8n_workflow_info`, durable scheduler). Without them, overview panels still work but webhook/scheduler sections stay empty.

Also set:

```yaml
N8N_METRICS_INCLUDE_WORKFLOW_ID_LABEL: "true"
```

so `n8n_workflow_execution_duration_seconds_*` carries `workflow_id` (needed for per-workflow joins). Histograms only appear **after the first matching event** post-restart — hit any production webhook, wait one Prometheus scrape (~15–30s), then refresh Grafana.

Endpoint: `GET /metrics` on the n8n HTTP port (`http://localhost:5678/metrics` or via the public host).

### Grafana dashboard

Combined dashboard JSON (Prometheus metrics only — all workflows + webhook deep-dive): [`grafana/dashboards/n8n-combined.json`](grafana/dashboards/n8n-combined.json). See that folder’s [README](grafana/dashboards/README.md). Loki/Tempo panels and scheduler panels are omitted.

### Grafana Prometheus scrape (configure on the Grafana server)

```yaml
- job_name: n8n
  metrics_path: /metrics
  scheme: https
  static_configs:
    - targets: ["n8n.alt-mobility.com"]
```

Prefer an **internal** scrape target (private IP / Docker network) when possible so `/metrics` is not the only public surface. The endpoint can expose operational details.

Local check:

```bash
curl -sS http://localhost:5678/metrics | head
```

---

## Logs (Promtail → Loki)

- Config: [`promtail-config.yml`](promtail-config.yml)
- Service: `promtail` in [`docker-compose.yml`](docker-compose.yml)
- n8n logs to console (`N8N_LOG_LEVEL=info`, `N8N_LOG_OUTPUT=console`); Promtail scrapes Docker via `/var/run/docker.sock` and pushes to Loki.

Loki client (same as the shared sample):

- URL: `https://loki.alt-mobility.com/loki/api/v1/push`
- Labels include `job=docker`, `environment=production`, `service=n8n`, plus `container=<name>`

Example Loki query:

```logql
{job="docker", container=~".*n8n.*"}
```

Promtail UI (optional): [http://localhost:9080](http://localhost:9080)

Positions / state live in `promtail-data/` (gitignored).

---

## Start / restart

```bash
cd server
docker compose up -d
```

Checks:

```bash
# n8n up
curl -sS http://localhost:5678/healthz

# metrics
curl -sS http://localhost:5678/metrics | head

# OTEL / runners
docker compose logs n8n | grep -Ei 'otel|OpenTelemetry|Registered runner|Task Broker'

# Promtail — should list docker targets and push batches (not only "Starting Promtail")
docker compose logs promtail --tail 50
curl -sS http://localhost:9080/metrics | grep -E 'promtail_sent_entries_total|promtail_targets_active_total'
```

### Promtail not shipping / Grafana logs stale

**Symptom:** Loki/Grafana shows no new lines; `docker logs promtail` only shows startup.

**Common cause:** Docker Compose **project name** mismatch. Promtail used to filter `com.docker.compose.project=server`, but if you run compose from `~/` the project becomes `ubuntu` (`ubuntu-promtail-1`, `ubuntu-n8n-1`) and Promtail discovers **zero** containers.

**Fix on the server:** align Promtail’s Docker SD filter with the real Compose project name (container prefix). On this host compose runs from `/home/ubuntu`, so project is `ubuntu` and `promtail-config.yml` filters `com.docker.compose.project=ubuntu`.

```bash
# confirm
docker inspect ubuntu-n8n-1 --format '{{index .Config.Labels "com.docker.compose.project"}}'

# after updating promtail-config.yml
docker-compose restart promtail
docker-compose logs promtail --tail 30
# expect several "added Docker target" lines (n8n, postgres, python-runner, …)
```

Verify in Grafana Explore (Loki): `{job="docker", compose_service="n8n"}` — latest line should be within the last minute after n8n activity.

---

## Related

- Runner packages / external mode: [`runner-setup.md`](runner-setup.md)
- Sample Promtail source: `../tmp-server-log-example/`
