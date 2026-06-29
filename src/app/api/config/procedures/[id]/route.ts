import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import {
  getProcedureById,
  updateProcedure,
  deleteProcedure,
  SubDeptServiceError,
} from "../../../../../../backend/services/subdepartment.service";
import { updateProcedureSchema } from "../../../../../../backend/validations/subdepartment.validation";
import { withApiRoute } from "../../../../../../backend/utils/api-route";

export const GET = withApiRoute("config.procedures.id.get", async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const data = await getProcedureById(params.id, auth.hospitalId);
    return successResponse(data, "Procedure fetched");
  } catch (error: any) {
    if (error instanceof SubDeptServiceError) return errorResponse(error.message, error.status);
    return errorResponse(error.message || "Failed to fetch procedure", 500);
  }
});

export const PUT = withApiRoute("config.procedures.id.put", async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const validated = updateProcedureSchema.safeParse(body);
    if (!validated.success) return errorResponse("Validation failed", 400, validated.error.issues);
    const data = await updateProcedure(params.id, auth.hospitalId, validated.data);
    return successResponse(data, "Procedure updated successfully");
  } catch (error: any) {
    if (error instanceof SubDeptServiceError) return errorResponse(error.message, error.status);
    return errorResponse(error.message || "Failed to update procedure", 500);
  }
});

export const DELETE = withApiRoute("config.procedures.id.delete", async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    await deleteProcedure(params.id, auth.hospitalId);
    return successResponse(null, "Procedure deleted successfully");
  } catch (error: any) {
    if (error instanceof SubDeptServiceError) return errorResponse(error.message, error.status);
    return errorResponse(error.message || "Failed to delete procedure", 500);
  }
});
