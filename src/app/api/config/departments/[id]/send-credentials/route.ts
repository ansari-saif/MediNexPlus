import { NextRequest } from "next/server";
import { logger } from "../../../../../../../backend/utils/logger";
import { requireHospitalAdmin } from "../../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../../backend/utils/response";
import {
  createDeptCredentials,
  resendDeptCredentials,
  DepartmentServiceError,
} from "../../../../../../../backend/services/department.service";
import { sendDeptCredentials } from "../../../../../../../backend/utils/mailer";
import prisma from "../../../../../../../backend/config/db";
import { withApiRoute } from "../../../../../../../backend/utils/api-route";
const log_src_app_api_config_departments__id__send_credentials_route = logger.child("src/app/api/config/departments/[id]/send-credentials/route");

export const POST = withApiRoute("config.departments.id.send-credentials.post", async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  const isResend = req.nextUrl.searchParams.get("resend") === "true";

  let customPassword: string | undefined;
  try {
    const body = await req.json().catch(() => ({}));
    customPassword = body?.password || undefined;
  } catch {}

  try {
    const credentials = isResend
      ? await resendDeptCredentials(params.id, auth.hospitalId, customPassword)
      : await createDeptCredentials(params.id, auth.hospitalId, customPassword);

    const [hospital, dept] = await Promise.all([
      prisma.hospital.findUnique({ where: { id: auth.hospitalId }, select: { name: true } }),
      prisma.department.findFirst({
        where: { id: params.id, hospitalId: auth.hospitalId },
        select: { name: true, type: true },
      }),
    ]);

    if (!dept) return errorResponse("Department not found", 404);

    const hospitalName = hospital?.name || "Hospital";
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login`;

    log_src_app_api_config_departments__id__send_credentials_route.info(`[DeptCredentials] ${isResend ? "Resent" : "Created"} credentials for dept "${dept.name}": email=${credentials.email}, password=${credentials.password}`);

    // Send email (non-blocking — don't fail if mailer is down)
    sendDeptCredentials({
      to: credentials.email,
      name: dept.name,
      email: credentials.email,
      password: credentials.password,
      deptName: dept.name,
      deptType: dept.type,
      hospitalName,
      loginUrl,
    }).catch((err: any) => log_src_app_api_config_departments__id__send_credentials_route.error("[DeptCredentials] Email send failed:", err.message));

    return successResponse(
      { email: credentials.email, password: credentials.password },
      isResend ? "New login credentials sent successfully" : "Login credentials sent successfully"
    );
  } catch (error: any) {
    if (error instanceof DepartmentServiceError) return errorResponse(error.message, error.status);
    return errorResponse(error.message || "Failed to send credentials", 500);
  }
});
