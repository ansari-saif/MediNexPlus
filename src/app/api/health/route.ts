import { NextRequest } from "next/server";
import prisma from "../../../../backend/config/db";
import { withApiRoute } from "../../../../backend/utils/api-route";

export const GET = withApiRoute("health.get", async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true, status: "healthy", database: "connected" });
  } catch (error: any) {
    return Response.json(
      { ok: false, status: "unhealthy", database: "disconnected", message: error?.message || "Database check failed" },
      { status: 503 }
    );
  }
});
