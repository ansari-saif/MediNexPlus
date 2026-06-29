import { NextRequest, NextResponse } from "next/server";
import { logger } from "../../../../../../backend/utils/logger";
import { serviceService } from "../../../../../../backend/services/service.service";
import { updateServiceSchema } from "../../../../../../backend/validations/service.validation";
import { withAuth, checkPermission, createPermissionError, createUnauthorizedError } from "../../../../../../backend/middlewares/permission.middleware";
import { withApiRoute } from "../../../../../../backend/utils/api-route";
const log_src_app_api_config_services__id__route = logger.child("src/app/api/config/services/[id]/route");

export const GET = withApiRoute("config.services.id.get", async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const authReq = withAuth(req);
    if (!authReq.user) {
      return createUnauthorizedError();
    }

    const service = await serviceService.getService(params.id, authReq.user.hospitalId);

    return NextResponse.json({
      success: true,
      data: service,
    });
  } catch (error: any) {
    log_src_app_api_config_services__id__route.error("Get service error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch service" },
      { status: 404 }
    );
  }
});

export const PUT = withApiRoute("config.services.id.put", async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const authReq = withAuth(req);
    if (!authReq.user) {
      return createUnauthorizedError();
    }

    if (!checkPermission(authReq, "PROCEDURE_MANAGE")) {
      return createPermissionError("PROCEDURE_MANAGE");
    }

    const body = await req.json();
    const validated = updateServiceSchema.parse({ ...body, id: params.id });

    const service = await serviceService.updateService(params.id, authReq.user.hospitalId, validated);

    return NextResponse.json({
      success: true,
      message: "Service updated successfully",
      data: service,
    });
  } catch (error: any) {
    log_src_app_api_config_services__id__route.error("Update service error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update service" },
      { status: 400 }
    );
  }
});

export const DELETE = withApiRoute("config.services.id.delete", async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const authReq = withAuth(req);
    if (!authReq.user) {
      return createUnauthorizedError();
    }

    if (!checkPermission(authReq, "PROCEDURE_MANAGE")) {
      return createPermissionError("PROCEDURE_MANAGE");
    }

    await serviceService.deleteService(params.id, authReq.user.hospitalId);

    return NextResponse.json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error: any) {
    log_src_app_api_config_services__id__route.error("Delete service error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete service" },
      { status: 400 }
    );
  }
});
