import { NextRequest, NextResponse } from "next/server";
import { logger } from "../../../../../../backend/utils/logger";
import { authMiddleware } from "../../../../../../backend/middlewares/auth.middleware";
import prisma from "../../../../../../backend/config/db";
import { withApiRoute } from "../../../../../../backend/utils/api-route";
const log_src_app_api_superadmin_hospitals__id__route = logger.child("src/app/api/superadmin/hospitals/[id]/route");

export const GET = withApiRoute("superadmin.hospitals.id.get", async (req: NextRequest, { params }: { params: { id: string } }) => {
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
      include: {
        _count: {
          select: {
            patients: true,
            doctors: true,
            staffMembers: true,
            appointments: true,
            departments: true,
          },
        },
      },
    });

    if (!hospital) {
      return NextResponse.json(
        { success: false, message: "Hospital not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...hospital,
        patients: hospital._count.patients,
        doctors: hospital._count.doctors,
        staff: hospital._count.staffMembers,
        appointments: hospital._count.appointments,
        departments: hospital._count.departments,
      },
    });
  } catch (error: any) {
    log_src_app_api_superadmin_hospitals__id__route.error("Get hospital error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch hospital" },
      { status: 500 }
    );
  }
});

export const DELETE = withApiRoute("superadmin.hospitals.id.delete", async (req: NextRequest, { params }: { params: { id: string } }) => {
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

    await (prisma as any).hospital.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: `Hospital "${hospital.name}" deleted successfully`,
    });
  } catch (error: any) {
    log_src_app_api_superadmin_hospitals__id__route.error("Delete hospital error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete hospital" },
      { status: 500 }
    );
  }
});
