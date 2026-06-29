import { NextRequest } from "next/server";
import { logger } from "../../../../../../../backend/utils/logger";
import { requireRole } from "../../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../../backend/utils/response";
import { hashPassword } from "../../../../../../../backend/utils/hash";
const log_src_app_api_config_doctors__id__send_credentials_route = logger.child("src/app/api/config/doctors/[id]/send-credentials/route");

const HR_ROLES = ["HOSPITAL_ADMIN", "SUB_DEPT_HEAD"];
import { sendDoctorCredentials } from "../../../../../../../backend/utils/mailer";
import prisma from "../../../../../../../backend/config/db";
import { withApiRoute } from "../../../../../../../backend/utils/api-route";

type Params = { params: Promise<{ id: string }> };

export const POST = withApiRoute("config.doctors.id.send-credentials.post", async (req: NextRequest, { params }: Params) => {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;

    const doctor = await prisma.doctor.findFirst({
      where: { id, hospitalId: auth.hospitalId },
      include: {
        user: true,
        hospital: { include: { settings: true } },
      },
    });

    if (!doctor) return errorResponse("Doctor not found", 404);

    // Generate a strong random password
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const specials = "!@#$%";
    let rawPassword =
      Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("") +
      specials[Math.floor(Math.random() * specials.length)] +
      Math.floor(Math.random() * 90 + 10);

    const hashedPassword = await hashPassword(rawPassword);

    if (doctor.userId) {
      // Update existing user's password and ensure role is DOCTOR
      await prisma.user.update({
        where: { id: doctor.userId },
        data: { password: hashedPassword, isActive: true, role: "DOCTOR" },
      });
    } else {
      // Create a new User account for this doctor
      const existingUser = await prisma.user.findUnique({ where: { email: doctor.email } });
      if (existingUser) {
        // Link existing user, update password, and enforce DOCTOR role
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { password: hashedPassword, isActive: true, role: "DOCTOR" },
        });
        await prisma.doctor.update({
          where: { id },
          data: { userId: existingUser.id },
        });
      } else {
        const newUser = await prisma.user.create({
          data: {
            hospitalId: auth.hospitalId,
            name: doctor.name,
            email: doctor.email,
            password: hashedPassword,
            role: "DOCTOR",
            isActive: true,
          },
        });
        await prisma.doctor.update({
          where: { id },
          data: { userId: newUser.id },
        });
      }
    }

    // Mark credentials as sent
    await prisma.doctor.update({
      where: { id },
      data: { credentialsSent: true },
    });

    const hospitalName =
      (doctor.hospital as any)?.settings?.hospitalName ||
      (doctor.hospital as any)?.name ||
      "Hospital";

    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login`;

    // Try to send email, but don't fail if SMTP is not configured
    let emailSent = false;
    try {
      await sendDoctorCredentials({
        to: doctor.email,
        name: doctor.name,
        email: doctor.email,
        password: rawPassword,
        hospitalName,
        loginUrl,
      });
      emailSent = true;
    } catch (emailError: any) {
      log_src_app_api_config_doctors__id__send_credentials_route.error("❌ Email sending failed:", emailError.message);
      log_src_app_api_config_doctors__id__send_credentials_route.info({}, "📧 DOCTOR CREDENTIALS (email failed to send):");
      log_src_app_api_config_doctors__id__send_credentials_route.info({}, "   Email: ${doctor.email}");
      log_src_app_api_config_doctors__id__send_credentials_route.info({}, "   Password: ${rawPassword}");
      log_src_app_api_config_doctors__id__send_credentials_route.info({}, "   Login: ${loginUrl}");
    }

    return successResponse(
      { credentialsSent: true, emailSent, password: emailSent ? undefined : rawPassword },
      emailSent 
        ? `Credentials sent successfully to ${doctor.email}` 
        : `Credentials created. Email failed - check console for password.`
    );
  } catch (e: any) {
    return errorResponse(e.message || "Failed to send credentials", 500);
  }
});
