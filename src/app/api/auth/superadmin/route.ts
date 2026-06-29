import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { setSuperAdminSessionCookie } from "../../../../../backend/utils/session-cookie";
import { generateToken } from "../../../../../backend/utils/jwt";
import { Role } from "@prisma/client";
import { env } from "../../../../../backend/config/env";
import { z } from "zod";
import { withApiRoute } from "../../../../../backend/utils/api-route";
import { recordAuthLogin } from "../../../../../backend/utils/auth-metrics";

const superAdminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  securityKey: z.string(),
});

export const POST = withApiRoute("auth.superadmin.post", async (req: NextRequest) => {
  try {
    const body = await req.json();
    const result = superAdminLoginSchema.safeParse(body);

    if (!result.success) {
      return errorResponse("Validation Failed", 400, result.error.issues);
    }

    const { email, password, securityKey } = result.data;

    if (
      email === env.SUPER_ADMIN_EMAIL &&
      password === env.SUPER_ADMIN_PASSWORD &&
      securityKey === env.SUPER_ADMIN_SECURITY_KEY
    ) {
      const token = generateToken({
        userId: "super-admin-001",
        role: Role.SUPER_ADMIN,
      });

      const response = successResponse(
        { user: { id: "super-admin-001", name: "Super Admin", role: Role.SUPER_ADMIN, email } }, 
        "Super Admin Login Successful"
      );

      setSuperAdminSessionCookie(response, req, token, "lax");
      recordAuthLogin("success", Role.SUPER_ADMIN);

      return response;
    }

    recordAuthLogin("fail", Role.SUPER_ADMIN);
    return errorResponse("Invalid Super Admin Credentials", 401);
  } catch (error: any) {
    return errorResponse(error.message, 401);
  }
});
