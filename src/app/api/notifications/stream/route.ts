import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { getUnreadCount } from "../../../../../backend/repositories/notification.repo";
import { withApiRoute } from "../../../../../backend/utils/api-route";
import { startSsePoll } from "../../../../../backend/utils/sse-poll";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withApiRoute("notifications.stream.get", async (req: NextRequest) => {
  const { user, error } = await authMiddleware(req);
  if (error || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const hospitalId = user.hospitalId;
  if (!hospitalId) {
    return new Response("No hospital context", { status: 400 });
  }

  const url = new URL(req.url);
  const typesParam = url.searchParams.get("types");
  const types = typesParam ? typesParam.split(",").filter(Boolean) : undefined;

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };

      // Send initial count immediately
      try {
        const count = await getUnreadCount(hospitalId, {
          userId: user.userId,
          role: user.role,
          types,
        });
        send({ unread: count });
      } catch {
        send({ unread: 0 });
      }

      const stopPoll = startSsePoll(async () => {
        const count = await getUnreadCount(hospitalId, {
          userId: user.userId,
          role: user.role,
          types,
        });
        send({ unread: count });
      }, 10_000, () => closed);

      const heartbeat = setInterval(() => {
        if (closed) { clearInterval(heartbeat); return; }
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          closed = true;
          clearInterval(heartbeat);
          stopPoll();
        }
      }, 25000);

      req.signal.addEventListener("abort", () => {
        closed = true;
        stopPoll();
        clearInterval(heartbeat);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
});
