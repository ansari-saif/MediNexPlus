import { NextRequest } from "next/server";
import { errorResponse } from "../../../../../backend/utils/response";
import { withApiRoute } from "../../../../../backend/utils/api-route";

export const GET = withApiRoute("ipd.vitals.get", async (_req: NextRequest) => {
  return errorResponse("Not implemented", 501);
});

export const POST = withApiRoute("ipd.vitals.post", async (_req: NextRequest) => {
  return errorResponse("Not implemented", 501);
});
