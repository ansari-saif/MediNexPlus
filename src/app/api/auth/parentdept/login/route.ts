import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "../../../../../../backend/utils/response";
import { setSessionCookie } from "../../../../../../backend/utils/session-cookie";
import prisma from "../../../../../../backend/config/db";
import { comparePassword } from "../../../../../../backend/utils/hash";
import { generateToken } from "../../../../../../backend/utils/jwt";
import { withApiRoute } from "../../../../../../backend/utils/api-route";
import { recordAuthLogin } from "../../../../../../backend/utils/auth-metrics";

export const POST = withApiRoute("auth.parentdept.login.post", async (req: NextRequest) => {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return errorResponse("Email and password are required", 400);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || String(user.role) !== "DEPT_HEAD") {
      recordAuthLogin("fail", "DEPT_HEAD");
      return errorResponse("Invalid credentials", 401);
    }
    if (!user.isActive) return errorResponse("Account is inactive. Contact hospital admin.", 403);

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      recordAuthLogin("fail", "DEPT_HEAD");
      return errorResponse("Invalid credentials", 401);
    }

    // Verify department is linked
    const dept = await (prisma as any).department.findFirst({
      where: { userId: user.id },
      select: { id: true, name: true, type: true, code: true },
    });
    if (!dept) return errorResponse("No department linked to this account", 400);

    const token = generateToken({ userId: user.id, role: user.role, hospitalId: user.hospitalId });

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        hospitalId: user.hospitalId,
        department: {
          id: dept.id,
          name: dept.name,
          type: dept.type,
          code: dept.code,
        },
      },
    });

    setSessionCookie(response, req, token);
    recordAuthLogin("success", "DEPT_HEAD");

    return response;
  } catch (error: any) {
    const msg = String(error?.message || "");
    const code = String(error?.code || "");
    const isDbDown =
      code === "P1001" ||
      msg.includes("Can't reach database server") ||
      msg.includes("Can't reach database") ||
      msg.includes("ECONNREFUSED") ||
      msg.includes("ETIMEDOUT");
    if (isDbDown) {
      return errorResponse("Unable to connect. Please check your internet connection and try again.", 503);
    }
    return errorResponse(msg || "Login failed", 500);
  }
});
