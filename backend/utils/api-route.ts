import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { createRequestLogger } from "./logger";
import { errorResponse } from "./response";
import { recordHttpMetrics } from "../../src/lib/observability/metrics";

type RouteHandler = (req: NextRequest, ctx?: any) => Promise<Response>;

export function withApiRoute(routeName: string, handler: RouteHandler): RouteHandler {
  return async (req: NextRequest, ctx?: unknown) => {
    const start = Date.now();
    const requestId = req.headers.get("x-request-id") ?? randomUUID();
    const log = createRequestLogger({ requestId, route: routeName });

    try {
      log.info({ method: req.method }, "request.start");
      const res = await handler(req, ctx);
      const durationMs = Date.now() - start;
      log.info({ status: res.status, durationMs }, "request.end");
      recordHttpMetrics(routeName, req.method, res.status, durationMs);
      return res;
    } catch (err) {
      const durationMs = Date.now() - start;
      log.error({ err, durationMs }, "request.error");
      recordHttpMetrics(routeName, req.method, 500, durationMs);
      return errorResponse("Internal Server Error", 500);
    }
  };
}
