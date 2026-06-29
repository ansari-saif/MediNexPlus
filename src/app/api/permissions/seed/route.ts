import { NextRequest, NextResponse } from "next/server";
import { logger } from "../../../../../backend/utils/logger";
import { permissionService } from "../../../../../backend/services/permission.service";
import { withAuth, createUnauthorizedError } from "../../../../../backend/middlewares/permission.middleware";
import { withApiRoute } from "../../../../../backend/utils/api-route";
const log_src_app_api_permissions_seed_route = logger.child("src/app/api/permissions/seed/route");

export const POST = withApiRoute("permissions.seed.post", async (req: NextRequest) => {
  try {
    const authReq = withAuth(req);
    if (!authReq.user) {
      return createUnauthorizedError();
    }

    // Only admins can seed permissions
    if (authReq.user.role !== "HOSPITAL_ADMIN" && authReq.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    // Seed default permissions
    const permissions = await permissionService.seedDefaultPermissions();

    // Initialize role permissions
    await permissionService.initializeRolePermissions();

    return NextResponse.json({
      success: true,
      message: "Permissions seeded successfully",
      data: {
        permissionsCreated: permissions.length,
        rolesInitialized: 6,
      },
    });
  } catch (error: any) {
    log_src_app_api_permissions_seed_route.error("Seed permissions error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to seed permissions" },
      { status: 500 }
    );
  }
});
