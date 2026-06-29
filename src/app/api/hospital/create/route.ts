import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { roleMiddleware } from "../../../../../backend/middlewares/role.middleware";
import { Role } from "@prisma/client";
import { createHospital } from "../../../../../backend/repositories/hospital.repo";
import { onboardHospitalBySuperAdmin } from "../../../../../backend/services/auth.service";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { z } from "zod";
import { withApiRoute } from "../../../../../backend/utils/api-route";

const simpleCreateSchema = z.object({
  name: z.string().min(2),
  mobile: z.string().min(10),
  email: z.string().email(),
});

const onboardHospitalSchema = z
  .object({
    hospitalName: z.string().min(2, "Hospital name must be at least 2 characters"),
    adminName: z.string().min(2, "Admin name must be at least 2 characters"),
    mobile: z.string().min(10, "Mobile must be at least 10 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const POST = withApiRoute("hospital.create.post", async (req: NextRequest) => {
  try {
    const { user, error: authError } = await authMiddleware(req, "superadmin");
    if (authError) return authError;

    const roleCheck = roleMiddleware(user!, [Role.SUPER_ADMIN]);
    if (roleCheck.error) return roleCheck.error;

    const body = await req.json();

    // Superadmin UI: full onboarding with admin account
    if ("hospitalName" in body || "adminName" in body || "password" in body) {
      const result = onboardHospitalSchema.safeParse(body);
      if (!result.success) {
        return errorResponse("Validation Failed", 400, result.error.issues);
      }

      const onboarded = await onboardHospitalBySuperAdmin({
        hospitalName: result.data.hospitalName,
        adminName: result.data.adminName,
        email: result.data.email,
        mobile: result.data.mobile,
        password: result.data.password,
      });

      return successResponse(onboarded, "Hospital created successfully", 201);
    }

    // Legacy/simple create (hospital record only)
    const result = simpleCreateSchema.safeParse(body);
    if (!result.success) {
      return errorResponse("Validation Failed", 400, result.error.issues);
    }

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 14);

    const hospital = await createHospital({
      ...result.data,
      isVerified: true,
      trialStartDate: now,
      trialEndDate: trialEnd,
      subscriptionStatus: "TRIAL",
    });

    return successResponse(hospital, "Hospital created successfully", 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
});
