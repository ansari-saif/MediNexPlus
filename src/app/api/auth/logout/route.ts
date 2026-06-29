import { NextRequest } from "next/server";
import { successResponse } from "../../../../../backend/utils/response";
import { withApiRoute } from "../../../../../backend/utils/api-route";
import {
  clearAllSessionCookies,
  clearSessionCookie,
  clearSuperAdminSessionCookie,
} from "../../../../../backend/utils/session-cookie";

export const POST = withApiRoute("auth.logout.post", async (req: NextRequest) => {
  const portal = req.nextUrl.searchParams.get("portal");
  const response = successResponse(null, "Logged out successfully");

  if (portal === "superadmin") {
    clearSuperAdminSessionCookie(response, req);
  } else if (portal === "all") {
    clearAllSessionCookies(response, req);
  } else {
    clearSessionCookie(response, req);
  }

  return response;
});
