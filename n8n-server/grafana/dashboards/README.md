# n8n Grafana Dashboards

## How to read the dashboard (plain language)

**Time picker (top-right) matters.** Almost every number is “how many times in **this** window” — not all-time totals.

| Section | What the numbers mean |
|---------|------------------------|
| **Total / Successful / Failed Executions** | Whole workflow runs (any mode) in the time range |
| **Runs per workflow** | Same — per workflow name. **0 = no runs in that window** (not broken) |
| **Webhook deep dive → HTTP requests** | Only production calls to `https://n8n.alt-mobility.com/webhook/...` (e.g. FleetOS). **n8n “Test workflow” does not count** |
| **Success rate / latency charts** | Percentages and seconds — not counts |

Counts are **rounded whole numbers** (no more `4.28`-style decimals).

This dashboard is **Prometheus metrics only** (no Loki/Tempo panels). If FleetOS triggered a report but webhook requests stay **0**, the call never reached n8n (auth/CORS/network) — check the browser Network tab.

## `n8n-combined.json`

Combined production dashboard for alt-mobility n8n:

| Section | Source |
|---------|--------|
| **All Workflows** — instance, counts by mode/status, top workflows, latency, memory | Local (`n8n_workflow_execution_duration_*`, `n8n_workflow_info`, …) |
| **Webhook workflows only** — path rates, HTTP status, webhook latency | [n8n-observability / n8n-webhook-executions](https://github.com/n8n-io/n8n-observability/tree/main/dashboards/grafana/n8n-webhook-executions) |

Durable Scheduler panels are **not** included — that feature is off on this stack (`N8N_SCHEDULER_ENABLED` default false), so `n8n_scheduler_*` series never appear. Re-add from [n8n-scheduler](https://github.com/n8n-io/n8n-observability/tree/main/dashboards/grafana/n8n-scheduler) only after enabling the durable scheduler.

Prometheus datasource UID is set to `dezcdxo7bplhcf` (Grafana at `grafana.alt-mobility.com`).  
Environment picker default: `https://n8n.alt-mobility.com`.

### Required n8n metrics flags

Webhook + scheduler panels need these on the n8n service (already in [`docker-compose.yml`](../../docker-compose.yml)):

```yaml
N8N_METRICS: "true"
N8N_METRICS_INCLUDE_DEFAULT_METRICS: "true"
N8N_METRICS_INCLUDE_WEBHOOK_METRICS: "true"
N8N_METRICS_INCLUDE_WORKFLOW_INFO: "true"
N8N_METRICS_INCLUDE_SCHEDULER_METRICS: "true"
N8N_METRICS_INCLUDE_WORKFLOW_ID_LABEL: "true"
```

Redeploy n8n after changing flags, then confirm:

```bash
curl -sS https://n8n.alt-mobility.com/metrics | grep -E 'n8n_webhook_request_duration|n8n_workflow_info|n8n_scheduler_'
```

**Why Webhook panels show "No data" after deploy**

1. Upstream dashboard joins execution counters on `workflow_id`. That label is off by default — our combined JSON avoids that join for the top stats; still enable `N8N_METRICS_INCLUDE_WORKFLOW_ID_LABEL` for fuller per-workflow views later.
2. `n8n_webhook_request_duration_seconds_*` samples only exist after a real webhook runs (restart clears counters). Generate traffic, wait for Prometheus scrape, hard-refresh the dashboard.

### Import (UI)

1. Grafana → **Dashboards → Import**
2. Upload `n8n-combined.json`
3. Confirm Prometheus datasource → **Import**

### Import (API)

From repo root (uses `GRAFANA_SERVICE_TOKEN` in `.env`):

```bash
python3 - <<'PY'
import json, os, urllib.request
from pathlib import Path
env = dict(line.split("=", 1) for line in Path(".env").read_text().splitlines() if "=" in line and not line.strip().startswith("#"))
token = env["GRAFANA_SERVICE_TOKEN"].strip().strip('"')
dash = json.loads(Path("server/grafana/dashboards/n8n-combined.json").read_text())
body = json.dumps({"dashboard": dash, "overwrite": True, "message": "import n8n-combined"}).encode()
req = urllib.request.Request(
    "https://grafana.alt-mobility.com/api/dashboards/db",
    data=body,
    method="POST",
    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
)
with urllib.request.urlopen(req, timeout=60) as r:
    print(r.read().decode())
PY
```

Dashboard UID: `n8n-combined` →  
`https://grafana.alt-mobility.com/d/n8n-combined`
