import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../backend/utils/response";
import { withApiRoute } from "../../../../backend/utils/api-route";
import {
  listNotifications,
  markNotificationsRead,
  markSingleRead,
} from "../../../../backend/services/notification.service";

export const GET = withApiRoute("notifications.get", async (req: NextRequest) => {
  const { user, error } = await authMiddleware(req);
  if (error) return error;

  const hospitalId = user!.hospitalId;
  if (!hospitalId) return errorResponse("No hospital context", 400);

  const url = new URL(req.url);
  const limit  = parseInt(url.searchParams.get("limit")  || "20");
  const offset = parseInt(url.searchParams.get("offset") || "0");
  const typesParam = url.searchParams.get("types");
  const types = typesParam ? typesParam.split(",").filter(Boolean) : undefined;

  const result = await listNotifications(hospitalId, {
    userId: user!.userId,
    role:   user!.role,
    limit,
    offset,
    types,
  });

  return successResponse(result, "Notifications fetched");
});

export const PATCH = withApiRoute("notifications.patch", async (req: NextRequest) => {
  const { user, error } = await authMiddleware(req);
  if (error) return error;

  const hospitalId = user!.hospitalId;
  if (!hospitalId) return errorResponse("No hospital context", 400);

  const body = await req.json().catch(() => ({}));

  if (body.id) {
    await markSingleRead(body.id);
    return successResponse(null, "Marked as read");
  }

  await markNotificationsRead(hospitalId, {
    userId: user!.userId,
    role:   user!.role,
  });
  return successResponse(null, "All marked as read");
});
