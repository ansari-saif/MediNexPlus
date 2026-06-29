import { NextRequest } from "next/server";
import { logger } from "../../../../../../backend/utils/logger";
import { requireRole } from "../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import { Role } from "@prisma/client";
import prisma from "../../../../../../backend/config/db";
import { withApiRoute } from "../../../../../../backend/utils/api-route";
const log_src_app_api_pharmacy_counter_sale_history_route = logger.child("src/app/api/pharmacy/counter-sale/history/route");

const px = prisma as any;

/**
 * GET /api/pharmacy/counter-sale/history
 * Returns recent counter sales (bills tagged with PHARMACY_COUNTER_SALE)
 */
export const GET = withApiRoute("pharmacy.counter-sale.history.get", async (req: NextRequest) => {
  const auth = await requireRole(req, [Role.SUB_DEPT_HEAD, Role.HOSPITAL_ADMIN, Role.STAFF, Role.RECEPTIONIST]);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const bills = await px.bill.findMany({
      where: {
        hospitalId: auth.hospitalId,
        notes: { contains: "PHARMACY_COUNTER_SALE" },
      },
      include: {
        patient: { select: { id: true, name: true, patientId: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const history = bills.map((bill: any) => {
      let items = [];
      try { items = typeof bill.items === "string" ? JSON.parse(bill.items) : bill.items; } catch {}
      return {
        id: bill.id,
        billNo: bill.billNo,
        patient: bill.patient,
        items,
        paymentMethod: bill.paymentMethod,
        transactionId: bill.transactionId,
        total: bill.total,
        discount: bill.discount,
        status: bill.status,
        createdAt: bill.createdAt,
      };
    });

    return successResponse(history, "Counter sale history fetched");
  } catch (err: any) {
    log_src_app_api_pharmacy_counter_sale_history_route.error("Counter-sale history error:", err);
    return errorResponse(err.message || "Failed to fetch history", 500);
  }
});
