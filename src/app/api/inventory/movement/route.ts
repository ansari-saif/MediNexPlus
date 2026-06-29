import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import * as service from "../../../../../backend/services/inventory.service";
import { withApiRoute } from "../../../../../backend/utils/api-route";

const INV_READ_ROLES = ["HOSPITAL_ADMIN", "FINANCE_HEAD", "SUB_DEPT_HEAD"];

export const GET = withApiRoute("inventory.movement.get", async (req: NextRequest) => {
  const auth = await requireRole(req, INV_READ_ROLES);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId") || undefined;
    const data = await service.getMovements(auth.hospitalId, itemId);
    return successResponse(data, "Movements fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
});
