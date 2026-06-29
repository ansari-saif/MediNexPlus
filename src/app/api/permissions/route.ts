import { NextRequest, NextResponse } from "next/server";
import { logger } from "../../../../backend/utils/logger";
import { permissionService } from "../../../../backend/services/permission.service";
import { withAuth, createUnauthorizedError } from "../../../../backend/middlewares/permission.middleware";
import { withApiRoute } from "../../../../backend/utils/api-route";
const log_src_app_api_permissions_route = logger.child("src/app/api/permissions/route");

export const GET = withApiRoute("permissions.get", async (req: NextRequest) => {
  try {
    const authReq = withAuth(req);
    if (!authReq.user) {
      return createUnauthorizedError();
    }

    // Only admins can view all permissions
    if (authReq.user.role !== "HOSPITAL_ADMIN" && authReq.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const module = searchParams.get("module") || undefined;
    const grouped = searchParams.get("grouped") === "true";

    let permissions;
    if (grouped) {
      permissions = await permissionService.getPermissionsByModule();
    } else {
      permissions = await permissionService.getAllPermissions(module);
    }

    return NextResponse.json({
      success: true,
      data: permissions,
    });
  } catch (error: any) {
    log_src_app_api_permissions_route.error("Get permissions error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch permissions" },
      { status: 500 }
    );
  }
});
