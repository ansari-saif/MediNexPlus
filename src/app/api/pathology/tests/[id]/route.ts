import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import { getSubDeptProfile } from "../../../../../../backend/services/subdepartment.service";
import prisma from "../../../../../../backend/config/db";
import { withApiRoute } from "../../../../../../backend/utils/api-route";

export const PUT = withApiRoute("pathology.tests.id.put", async (req: NextRequest, { params }: { params: { id: string } }) => {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (!["SUB_DEPT_HEAD", "HOSPITAL_ADMIN"].includes(user!.role)) return errorResponse("Forbidden", 403);

  try {
    const body = await req.json();
    const { name, code, category, specimenType, price, unit, normalRangeMin, normalRangeMax, normalRangeText, method, turnaroundHrs, machineId, isActive } = body;

    const test = await (prisma as any).labTest.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(category !== undefined && { category }),
        ...(specimenType !== undefined && { specimenType }),
        ...(price !== undefined && { price: parseFloat(price) || 0 }),
        ...(unit !== undefined && { unit }),
        ...(normalRangeMin !== undefined && { normalRangeMin: normalRangeMin !== "" ? parseFloat(normalRangeMin) : null }),
        ...(normalRangeMax !== undefined && { normalRangeMax: normalRangeMax !== "" ? parseFloat(normalRangeMax) : null }),
        ...(normalRangeText !== undefined && { normalRangeText }),
        ...(method !== undefined && { method }),
        ...(turnaroundHrs !== undefined && { turnaroundHrs: parseInt(turnaroundHrs) || 24 }),
        ...(machineId !== undefined && { machineId }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    return successResponse(test);
  } catch (err: any) {
    return errorResponse(err.message || "Failed", 500);
  }
});

export const DELETE = withApiRoute("pathology.tests.id.delete", async (req: NextRequest, { params }: { params: { id: string } }) => {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (!["SUB_DEPT_HEAD", "HOSPITAL_ADMIN"].includes(user!.role)) return errorResponse("Forbidden", 403);

  try {
    await (prisma as any).labTest.delete({ where: { id: params.id } });
    return successResponse({ deleted: true });
  } catch (err: any) {
    return errorResponse(err.message || "Failed", 500);
  }
});
