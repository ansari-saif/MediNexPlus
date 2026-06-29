import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import {
  getBedById, updateBedService, deleteBedService, BedServiceError,
} from "../../../../../../backend/services/bed.service";
import { z } from "zod";
import { withApiRoute } from "../../../../../../backend/utils/api-route";

const updateSchema = z.object({
  bedNumber: z.string().min(1).optional(),
  bedType: z.enum(["NORMAL","ICU","VENTILATOR","ELECTRIC","PEDIATRIC"]).optional(),
  status: z.enum(["AVAILABLE","OCCUPIED","MAINTENANCE","RESERVED"]).optional(),
  pricePerDay: z.number().min(0).optional(),
  roomId: z.string().optional(),
});

export const GET = withApiRoute("config.beds.id.get", async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const data = await getBedById(params.id, auth.hospitalId);
    return successResponse(data, "Bed fetched");
  } catch (e: any) {
    if (e instanceof BedServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message, 500);
  }
});

export const PUT = withApiRoute("config.beds.id.put", async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const result = updateSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);
    const data = await updateBedService(params.id, auth.hospitalId, result.data);
    return successResponse(data, "Bed updated");
  } catch (e: any) {
    if (e instanceof BedServiceError) return errorResponse(e.message, e.status, { code: e.code });
    return errorResponse(e.message, 500);
  }
});

export const DELETE = withApiRoute("config.beds.id.delete", async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    await deleteBedService(params.id, auth.hospitalId);
    return successResponse(null, "Bed deleted");
  } catch (e: any) {
    if (e instanceof BedServiceError) return errorResponse(e.message, e.status, { code: e.code });
    return errorResponse(e.message, 500);
  }
});
