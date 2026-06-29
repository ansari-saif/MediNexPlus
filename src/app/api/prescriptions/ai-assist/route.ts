import { NextRequest } from "next/server";
import { logger } from "../../../../../backend/utils/logger";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { getAiPrescriptionSuggestions } from "../../../../../backend/services/ai.service";
import { aiAssistSchema } from "../../../../../backend/validations/prescription.validation";
import { withApiRoute } from "../../../../../backend/utils/api-route";
const log_src_app_api_prescriptions_ai_assist_route = logger.child("src/app/api/prescriptions/ai-assist/route");

export const dynamic = "force-dynamic";

// POST /api/prescriptions/ai-assist — get AI suggestions for prescription
export const POST = withApiRoute("prescriptions.ai-assist.post", async (req: NextRequest) => {
  const auth = await requireRole(req, ["DOCTOR", "HOSPITAL_ADMIN"]);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    log_src_app_api_prescriptions_ai_assist_route.info("AI Assist Request Body:", JSON.stringify(body, null, 2));
    
    const result = aiAssistSchema.safeParse(body);
    if (!result.success) {
      log_src_app_api_prescriptions_ai_assist_route.error("AI Assist Validation Error:", result.error.issues);
      return errorResponse("Validation failed", 400, result.error.issues);
    }

    const suggestions = await getAiPrescriptionSuggestions(result.data as any);
    return successResponse(suggestions, "AI suggestions generated");
  } catch (e: any) {
    log_src_app_api_prescriptions_ai_assist_route.error("AI Assist Error:", e);
    return errorResponse(e.message || "AI service error", 500);
  }
});
