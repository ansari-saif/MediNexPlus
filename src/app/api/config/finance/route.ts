import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { getFinanceDept, upsertFinanceDept } from "../../../../../backend/services/billing.service";
import { withApiRoute } from "../../../../../backend/utils/api-route";

export const dynamic = "force-dynamic";

// GET /api/config/finance
export const GET = withApiRoute("config.finance.get", async (req: NextRequest) => {
  const auth = await requireRole(req, ["HOSPITAL_ADMIN"]);
  if (auth.error) return auth.error;
  try {
    const dept = await getFinanceDept(auth.hospitalId);
    return successResponse(dept, "Finance dept fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
});

// POST /api/config/finance — create/update finance dept
export const POST = withApiRoute("config.finance.post", async (req: NextRequest) => {
  const auth = await requireRole(req, ["HOSPITAL_ADMIN"]);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const dept = await upsertFinanceDept(auth.hospitalId, {
      name:     body.name,
      hodName:  body.hodName,
      hodEmail: body.hodEmail,
      hodPhone: body.hodPhone,
      isActive: body.isActive ?? true,
    });
    return successResponse(dept, "Finance dept saved");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
});
