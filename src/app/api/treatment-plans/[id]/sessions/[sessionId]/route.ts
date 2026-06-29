import { NextRequest, NextResponse } from "next/server";
import { treatmentService } from "../../../../../../../backend/services/treatment.service";
import { updateTreatmentSessionSchema } from "../../../../../../../backend/validations/treatment.validation";
import { withAuth, checkPermission, createPermissionError, createUnauthorizedError } from "../../../../../../../backend/middlewares/permission.middleware";
import { withApiRoute } from "../../../../../../../backend/utils/api-route";

export const PUT = withApiRoute("treatment-plans.id.sessions.sessionId.put", async (req: NextRequest,
  { params }: { params: { id: string; sessionId: string } }) => {
  try {
    const authReq = withAuth(req);
    if (!authReq.user) return createUnauthorizedError();

    if (!checkPermission(authReq, "PROCEDURE_PERFORM")) return createPermissionError("PROCEDURE_PERFORM");

    const body = await req.json();
    const validated = updateTreatmentSessionSchema.parse({ id: params.sessionId, ...body });
    const session = await treatmentService.updateTreatmentSession(
      params.sessionId,
      authReq.user.hospitalId,
      validated
    );

    return NextResponse.json({ success: true, message: "Session updated", data: session });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update session" },
      { status: 400 }
    );
  }
});
