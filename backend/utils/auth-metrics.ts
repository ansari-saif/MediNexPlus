import { authLoginTotal } from "../../src/lib/observability/metrics";

export function recordAuthLogin(result: "success" | "fail", role = "unknown"): void {
  authLoginTotal.inc({ result, role });
}
