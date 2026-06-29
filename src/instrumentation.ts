export async function register() {
  if (process.env.OTEL_ENABLED !== "1") return;
  await import("./lib/observability/register");
}
