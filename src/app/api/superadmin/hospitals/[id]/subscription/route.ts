import { NextRequest, NextResponse } from "next/server";
import { logger } from "../../../../../../../backend/utils/logger";
import { authMiddleware } from "../../../../../../../backend/middlewares/auth.middleware";
import prisma from "../../../../../../../backend/config/db";
import { withApiRoute } from "../../../../../../../backend/utils/api-route";
const log_src_app_api_superadmin_hospitals__id__subscription_route = logger.child("src/app/api/superadmin/hospitals/[id]/subscription/route");

// PATCH: Update hospital subscription (revoke trial, onboard to plan, suspend, etc.)
export const PATCH = withApiRoute("superadmin.hospitals.id.subscription.patch", async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const authResult = await authMiddleware(req, "superadmin");
    if (authResult.error || authResult.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { action, plan, cycle } = body;

    const hospital = await prisma.hospital.findUnique({ where: { id } });
    if (!hospital) {
      return NextResponse.json({ success: false, message: "Hospital not found" }, { status: 404 });
    }

    const now = new Date();

    if (action === "activate_subscription") {
      // Onboard hospital to a paid plan
      if (!plan || !cycle) {
        return NextResponse.json({ success: false, message: "Plan and billing cycle are required" }, { status: 400 });
      }

      const endDate = new Date(now);
      if (cycle === "MONTHLY") endDate.setMonth(endDate.getMonth() + 1);
      else if (cycle === "YEARLY") endDate.setFullYear(endDate.getFullYear() + 1);

      await prisma.hospital.update({
        where: { id },
        data: {
          subscriptionStatus: "ACTIVE",
          subscriptionPlan: plan,
          billingCycle: cycle,
          subscriptionStartDate: now,
          subscriptionEndDate: endDate,
        },
      });

      return NextResponse.json({ success: true, message: `Hospital onboarded to ${plan} (${cycle})` });
    }

    if (action === "extend_trial") {
      // Extend or restart trial by 14 days from now
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + 14);

      await prisma.hospital.update({
        where: { id },
        data: {
          subscriptionStatus: "TRIAL",
          trialStartDate: now,
          trialEndDate: trialEnd,
        },
      });

      return NextResponse.json({ success: true, message: "Trial extended by 14 days" });
    }

    if (action === "suspend") {
      await prisma.hospital.update({
        where: { id },
        data: { subscriptionStatus: "SUSPENDED" },
      });
      return NextResponse.json({ success: true, message: "Hospital suspended" });
    }

    if (action === "cancel") {
      await prisma.hospital.update({
        where: { id },
        data: { subscriptionStatus: "CANCELLED" },
      });
      return NextResponse.json({ success: true, message: "Subscription cancelled" });
    }

    if (action === "reactivate") {
      // Reactivate with existing plan or as trial
      const subPlan = (hospital as any).subscriptionPlan;
      const subCycle = (hospital as any).billingCycle;

      if (subPlan && subCycle) {
        const endDate = new Date(now);
        if (subCycle === "MONTHLY") endDate.setMonth(endDate.getMonth() + 1);
        else endDate.setFullYear(endDate.getFullYear() + 1);

        await prisma.hospital.update({
          where: { id },
          data: {
            subscriptionStatus: "ACTIVE",
            subscriptionStartDate: now,
            subscriptionEndDate: endDate,
          },
        });
      } else {
        const trialEnd = new Date(now);
        trialEnd.setDate(trialEnd.getDate() + 14);
        await prisma.hospital.update({
          where: { id },
          data: {
            subscriptionStatus: "TRIAL",
            trialStartDate: now,
            trialEndDate: trialEnd,
          },
        });
      }

      return NextResponse.json({ success: true, message: "Hospital reactivated" });
    }

    return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    log_src_app_api_superadmin_hospitals__id__subscription_route.error("Subscription update error:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed" }, { status: 500 });
  }
});

// POST: Record a payment for a hospital
export const POST = withApiRoute("superadmin.hospitals.id.subscription.post", async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const authResult = await authMiddleware(req, "superadmin");
    if (authResult.error || authResult.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { amount, plan, cycle, notes } = body;

    if (!amount || !plan || !cycle) {
      return NextResponse.json({ success: false, message: "Amount, plan, and cycle are required" }, { status: 400 });
    }

    const now = new Date();
    const validUntil = new Date(now);
    if (cycle === "MONTHLY") validUntil.setMonth(validUntil.getMonth() + 1);
    else if (cycle === "YEARLY") validUntil.setFullYear(validUntil.getFullYear() + 1);

    const payment = await (prisma as any).subscriptionPayment.create({
      data: {
        hospitalId: id,
        amount: parseFloat(amount),
        plan,
        cycle,
        validFrom: now,
        validUntil,
        notes: notes || null,
        recordedBy: authResult.user?.userId || null,
      },
    });

    // Also activate the subscription
    await prisma.hospital.update({
      where: { id },
      data: {
        subscriptionStatus: "ACTIVE",
        subscriptionPlan: plan,
        billingCycle: cycle,
        subscriptionStartDate: now,
        subscriptionEndDate: validUntil,
      },
    });

    return NextResponse.json({ success: true, data: payment, message: "Payment recorded and subscription activated" });
  } catch (error: any) {
    log_src_app_api_superadmin_hospitals__id__subscription_route.error("Payment recording error:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed" }, { status: 500 });
  }
});

// GET: Get payment history for a hospital
export const GET = withApiRoute("superadmin.hospitals.id.subscription.get", async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const authResult = await authMiddleware(req, "superadmin");
    if (authResult.error || authResult.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const { id } = params;
    const payments = await (prisma as any).subscriptionPayment.findMany({
      where: { hospitalId: id },
      orderBy: { paidAt: "desc" },
    });

    return NextResponse.json({ success: true, data: payments });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Failed" }, { status: 500 });
  }
});
