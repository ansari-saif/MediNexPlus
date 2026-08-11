import client from "prom-client";

const globalForMetrics = globalThis as typeof globalThis & {
  __medinexMetricsRegistered?: boolean;
  __medinexAppMetrics?: {
    httpRequestsTotal: client.Counter<"method" | "route" | "status">;
    httpRequestDuration: client.Histogram<"method" | "route">;
    dbQueryDuration: client.Histogram<"model" | "operation">;
    dbQueryErrorsTotal: client.Counter<"model" | "operation">;
    authLoginTotal: client.Counter<"result" | "role">;
    billsCreatedTotal: client.Counter<"status">;
    appointmentsCreatedTotal: client.Counter<string>;
    prescriptionsCreatedTotal: client.Counter<string>;
    pharmacyQueueProcessedTotal: client.Counter<string>;
    externalCallDuration: client.Histogram<"provider">;
    aiRequestsTotal: client.Counter<"feature" | "result">;
  };
};

function ensureDefaultMetrics() {
  if (globalForMetrics.__medinexMetricsRegistered) return;
  client.collectDefaultMetrics({ register: client.register });
  globalForMetrics.__medinexMetricsRegistered = true;
}

ensureDefaultMetrics();

function getAppMetrics() {
  if (globalForMetrics.__medinexAppMetrics) {
    return globalForMetrics.__medinexAppMetrics;
  }

  const metrics = {
    httpRequestsTotal: new client.Counter({
      name: "http_requests_total",
      help: "Total HTTP API requests",
      labelNames: ["method", "route", "status"] as const,
    }),
    httpRequestDuration: new client.Histogram({
      name: "http_request_duration_seconds",
      help: "HTTP API request duration in seconds",
      labelNames: ["method", "route"] as const,
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    }),
    dbQueryDuration: new client.Histogram({
      name: "db_query_duration_seconds",
      help: "Prisma query duration in seconds",
      labelNames: ["model", "operation"] as const,
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    }),
    dbQueryErrorsTotal: new client.Counter({
      name: "db_query_errors_total",
      help: "Total Prisma query errors",
      labelNames: ["model", "operation"] as const,
    }),
    authLoginTotal: new client.Counter({
      name: "auth_login_total",
      help: "Authentication login attempts",
      labelNames: ["result", "role"] as const,
    }),
    billsCreatedTotal: new client.Counter({
      name: "bills_created_total",
      help: "Bills created or updated",
      labelNames: ["status"] as const,
    }),
    appointmentsCreatedTotal: new client.Counter({
      name: "appointments_created_total",
      help: "Appointments created",
      labelNames: [] as const,
    }),
    prescriptionsCreatedTotal: new client.Counter({
      name: "prescriptions_created_total",
      help: "Prescriptions created",
      labelNames: [] as const,
    }),
    pharmacyQueueProcessedTotal: new client.Counter({
      name: "pharmacy_queue_processed_total",
      help: "Pharmacy queue dispense events",
      labelNames: [] as const,
    }),
    externalCallDuration: new client.Histogram({
      name: "external_call_duration_seconds",
      help: "External provider call duration",
      labelNames: ["provider"] as const,
      buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30],
    }),
    aiRequestsTotal: new client.Counter({
      name: "ai_requests_total",
      help: "AI feature requests",
      labelNames: ["feature", "result"] as const,
    }),
  };

  globalForMetrics.__medinexAppMetrics = metrics;
  return metrics;
}

const appMetrics = getAppMetrics();

export const httpRequestsTotal = appMetrics.httpRequestsTotal;
export const httpRequestDuration = appMetrics.httpRequestDuration;
export const dbQueryDuration = appMetrics.dbQueryDuration;
export const dbQueryErrorsTotal = appMetrics.dbQueryErrorsTotal;
export const authLoginTotal = appMetrics.authLoginTotal;
export const billsCreatedTotal = appMetrics.billsCreatedTotal;
export const appointmentsCreatedTotal = appMetrics.appointmentsCreatedTotal;
export const prescriptionsCreatedTotal = appMetrics.prescriptionsCreatedTotal;
export const pharmacyQueueProcessedTotal = appMetrics.pharmacyQueueProcessedTotal;
export const externalCallDuration = appMetrics.externalCallDuration;
export const aiRequestsTotal = appMetrics.aiRequestsTotal;

export function recordHttpMetrics(
  route: string,
  method: string,
  status: number,
  durationMs: number
): void {
  const statusLabel = String(status);
  httpRequestsTotal.inc({ method, route, status: statusLabel });
  httpRequestDuration.observe({ method, route }, durationMs / 1000);
}

export function recordDbQueryMetrics(
  model: string,
  operation: string,
  durationMs: number,
  isError = false
): void {
  dbQueryDuration.observe({ model, operation }, durationMs / 1000);
  if (isError) {
    dbQueryErrorsTotal.inc({ model, operation });
  }
}

export function recordExternalCall(provider: string, durationMs: number): void {
  externalCallDuration.observe({ provider }, durationMs / 1000);
}

export async function getMetricsText(): Promise<string> {
  return client.register.metrics();
}

export function getMetricsContentType(): string {
  return client.register.contentType;
}

export { client as promClient };
