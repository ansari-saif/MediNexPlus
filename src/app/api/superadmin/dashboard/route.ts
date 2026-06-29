import { NextRequest, NextResponse } from "next/server";
import { logger } from "../../../../../backend/utils/logger";
import { getSuperAdminDashboardStats } from "../../../../../backend/services/hospital.service";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { withApiRoute } from "../../../../../backend/utils/api-route";
const log_src_app_api_superadmin_dashboard_route = logger.child("src/app/api/superadmin/dashboard/route");

export const GET = withApiRoute("superadmin.dashboard.get", async (req: NextRequest) => {
  try {
    const authResult = await authMiddleware(req, "superadmin");
    if (authResult.error || authResult.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Super Admin access required." },
        { status: 403 }
      );
    }

    const dashboardData = await getSuperAdminDashboardStats();

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch (error: any) {
    log_src_app_api_superadmin_dashboard_route.error("Superadmin dashboard error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
});
