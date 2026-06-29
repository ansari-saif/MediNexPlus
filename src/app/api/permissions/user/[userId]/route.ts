import { NextRequest, NextResponse } from "next/server";
import { logger } from "../../../../../../backend/utils/logger";
import { permissionService } from "../../../../../../backend/services/permission.service";
import { withAuth, createUnauthorizedError } from "../../../../../../backend/middlewares/permission.middleware";
import { withApiRoute } from "../../../../../../backend/utils/api-route";
const log_src_app_api_permissions_user__userId__route = logger.child("src/app/api/permissions/user/[userId]/route");

export const GET = withApiRoute("permissions.user.userId.get", async (req: NextRequest, { params }: { params: { userId: string } }) => {
  try {
    const authReq = withAuth(req);
    if (!authReq.user) {
      return createUnauthorizedError();
    }

    // Users can only view their own permissions, admins can view anyone's
    if (authReq.user.id !== params.userId && authReq.user.role !== "HOSPITAL_ADMIN" && authReq.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    const permissions = await permissionService.getUserEffectivePermissions(params.userId);

    return NextResponse.json({
      success: true,
      data: permissions,
    });
  } catch (error: any) {
    log_src_app_api_permissions_user__userId__route.error("Get user permissions error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch user permissions" },
      { status: 500 }
    );
  }
});
