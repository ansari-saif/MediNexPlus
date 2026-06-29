import { NextRequest, NextResponse } from "next/server";
import { logger } from "../../../../../../../backend/utils/logger";
import { authMiddleware } from "../../../../../../../backend/middlewares/auth.middleware";
import prisma from "../../../../../../../backend/config/db";
import { withApiRoute } from "../../../../../../../backend/utils/api-route";
const log_src_app_api_superadmin_hospitals__id__toggle_route = logger.child("src/app/api/superadmin/hospitals/[id]/toggle/route");

export const PATCH = withApiRoute("superadmin.hospitals.id.toggle.patch", async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const authResult = await authMiddleware(req, "superadmin");
    if (authResult.error || authResult.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Super Admin access required." },
        { status: 403 }
      );
    }

    const hospital = await (prisma as any).hospital.findUnique({
      where: { id: params.id },
    });

    if (!hospital) {
      return NextResponse.json(
        { success: false, message: "Hospital not found" },
        { status: 404 }
      );
    }

    const updated = await (prisma as any).hospital.update({
      where: { id: params.id },
      data: { isVerified: !hospital.isVerified },
    });

    return NextResponse.json({
      success: true,
      message: `Hospital ${updated.isVerified ? 'enabled' : 'disabled'} successfully`,
      data: updated,
    });
  } catch (error: any) {
    log_src_app_api_superadmin_hospitals__id__toggle_route.error("Toggle hospital status error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to toggle hospital status" },
      { status: 500 }
    );
  }
});
