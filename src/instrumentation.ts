export async function register() {
  if (process.env.OTEL_ENABLED !== "1") return;
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  await import("./lib/observability/register");
}
