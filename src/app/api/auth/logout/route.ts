import { NextRequest } from "next/server";
import { successResponse } from "../../../../../backend/utils/response";
import { clearSessionCookie } from "../../../../../backend/utils/session-cookie";

export async function POST(req: NextRequest) {
  const response = successResponse(null, "Logged out successfully");
  clearSessionCookie(response, req);

  return response;
}
