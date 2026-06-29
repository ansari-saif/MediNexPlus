import { NextRequest } from "next/server";
import { getMetricsContentType, getMetricsText } from "@/lib/observability/metrics";

function isInternalRequest(req: NextRequest): boolean {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first && first !== "127.0.0.1" && first !== "::1") {
      return false;
    }
  }

  const host = req.headers.get("host") || "";
  if (/^web:\d+$/.test(host) || /^127\.0\.0\.1:\d+$/.test(host) || /^localhost:\d+$/.test(host)) {
    return true;
  }

  const metricsToken = process.env.METRICS_TOKEN;
  if (metricsToken) {
    const auth = req.headers.get("authorization");
    return auth === `Bearer ${metricsToken}`;
  }

  return process.env.NODE_ENV !== "production";
}

export const GET = async (req: NextRequest) => {
  if (!isInternalRequest(req)) {
    return new Response("Forbidden", { status: 403 });
  }

  const body = await getMetricsText();
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": getMetricsContentType(),
      "Cache-Control": "no-store",
    },
  });
};

export const dynamic = "force-dynamic";
