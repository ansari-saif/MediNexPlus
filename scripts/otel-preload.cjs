/**
 * Node preload for OpenTelemetry + Pyroscope (production Docker).
 * Loaded via `node --require ./scripts/otel-preload.cjs` — never bundled by Next.js webpack.
 */
if (process.env.OTEL_ENABLED !== "1") {
  return;
}

const { NodeSDK } = require("@opentelemetry/sdk-node");
const { getNodeAutoInstrumentations } = require("@opentelemetry/auto-instrumentations-node");
const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-http");
const { OTLPMetricExporter } = require("@opentelemetry/exporter-metrics-otlp-http");
const { OTLPLogExporter } = require("@opentelemetry/exporter-logs-otlp-http");
const { PeriodicExportingMetricReader } = require("@opentelemetry/sdk-metrics");
const { BatchLogRecordProcessor } = require("@opentelemetry/sdk-logs");
const { Resource } = require("@opentelemetry/resources");
const { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } = require("@opentelemetry/semantic-conventions");
const Pyroscope = require("@pyroscope/nodejs");

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318";
const serviceName = process.env.OTEL_SERVICE_NAME || "medinexplus-web";

const traceExporter = new OTLPTraceExporter({ url: `${endpoint}/v1/traces` });
const metricExporter = new OTLPMetricExporter({ url: `${endpoint}/v1/metrics` });
const logExporter = new OTLPLogExporter({ url: `${endpoint}/v1/logs` });

const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: serviceName,
    [ATTR_SERVICE_VERSION]: process.env.npm_package_version || "0.1.0",
  }),
  traceExporter,
  metricReader: new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 15000,
  }),
  logRecordProcessor: new BatchLogRecordProcessor(logExporter),
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-fs": { enabled: false },
    }),
  ],
});

sdk.start();

const pyroscopeAddress = process.env.PYROSCOPE_SERVER_ADDRESS;
if (pyroscopeAddress) {
  Pyroscope.init({
    serverAddress: pyroscopeAddress,
    appName: process.env.PYROSCOPE_APPLICATION_NAME || serviceName,
    tags: { service: serviceName },
  });
  Pyroscope.start();
}

process.on("SIGTERM", () => {
  sdk.shutdown().catch(() => undefined);
});
