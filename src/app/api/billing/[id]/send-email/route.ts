import { NextRequest } from "next/server";
import { logger } from "../../../../../../backend/utils/logger";
import { authMiddleware } from "../../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import { sendBillInvoice } from "../../../../../../backend/utils/mailer";
import prisma from "../../../../../../backend/config/db";
import { withApiRoute } from "../../../../../../backend/utils/api-route";
const log_src_app_api_billing__id__send_email_route = logger.child("src/app/api/billing/[id]/send-email/route");

// Keep background promises alive so they aren't GC'd
const bgTasks = new Set<Promise<void>>();

async function sendWithRetry(opts: Parameters<typeof sendBillInvoice>[0], retries = 3, delay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      await sendBillInvoice(opts);
      log_src_app_api_billing__id__send_email_route.info({}, "[send-email] ✓ Delivered to ${opts.to} (attempt ${i + 1})");
      return;
    } catch (err: any) {
      log_src_app_api_billing__id__send_email_route.warn(`[send-email] Attempt ${i + 1}/${retries} failed for ${opts.to}:`, err.message);
      if (i < retries - 1) await new Promise(r => setTimeout(r, delay));
    }
  }
  log_src_app_api_billing__id__send_email_route.error({}, "[send-email] ✗ All ${retries} attempts failed for ${opts.to}");
}

export const POST = withApiRoute("billing.id.send-email.post", async (req: NextRequest, { params }: { params: { id: string } }) => {
  const { user, error: authError } = await authMiddleware(req);
  if (authError) return authError;

  try {
    const billId = params.id;
    const body = await req.json();
    const { pdfBase64 } = body;

    if (!pdfBase64) {
      return errorResponse("PDF data is required", 400);
    }

    // Fetch bill + patient + hospital in parallel for speed
    const [bill, hospital] = await Promise.all([
      (prisma as any).bill.findUnique({
        where: { id: billId, hospitalId: user!.hospitalId },
        include: { patient: { select: { email: true, name: true, patientId: true } } },
      }),
      prisma.hospital.findUnique({
        where: { id: user!.hospitalId as string },
        select: { name: true, settings: { select: { hospitalName: true, logo: true } } },
      }),
    ]);

    if (!bill) return errorResponse("Bill not found", 404);
    if (!bill.patient?.email) return errorResponse("Patient email not found", 400);

    const pdfBuffer = Buffer.from(pdfBase64, "base64");

    log_src_app_api_billing__id__send_email_route.info("[send-email] Queued:", bill.patient.email, "Bill:", bill.billNo);

    // Fire-and-forget with retry — respond immediately, email sends in background
    const task = sendWithRetry({
      to: bill.patient.email,
      patientName: bill.patient.name,
      patientId: bill.patient.patientId,
      billNo: bill.billNo || "N/A",
      billDate: new Date(bill.createdAt).toLocaleDateString("en-IN"),
      total: bill.total,
      paidAmount: bill.paidAmount || 0,
      status: bill.status,
      hospitalName: hospital?.settings?.hospitalName || hospital?.name || "Hospital",
      hospitalLogo: hospital?.settings?.logo || null,
      pdfBuffer,
    }).finally(() => bgTasks.delete(task));
    bgTasks.add(task);

    return successResponse({ sent: true, email: bill.patient.email }, "Invoice email queued");
  } catch (e: any) {
    log_src_app_api_billing__id__send_email_route.error("[send-email] Error:", e);
    return errorResponse(e.message || "Failed to send email", 500);
  }
});
