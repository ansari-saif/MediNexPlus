import { NextRequest } from "next/server";
import { logger } from "../../../../../backend/utils/logger";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { getAiLabResults } from "../../../../../backend/services/ai.service";
import { withApiRoute } from "../../../../../backend/utils/api-route";
const log_src_app_api_pathology_ai_results_route = logger.child("src/app/api/pathology/ai-results/route");

export const dynamic = "force-dynamic";

// POST /api/pathology/ai-results — AI-generate suggested lab result values
export const POST = withApiRoute("pathology.ai-results.post", async (req: NextRequest) => {
  const auth = await requireRole(req, ["SUB_DEPT_HEAD", "HOSPITAL_ADMIN", "STAFF", "DOCTOR"]);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const { tests, patientAge, patientGender, clinicalNotes, diagnosis, specimenType } = body;

    if (!tests || !Array.isArray(tests) || tests.length === 0) {
      return errorResponse("At least one test is required", 400);
    }

    const result = await getAiLabResults({
      tests,
      patientAge: patientAge ? Number(patientAge) : undefined,
      patientGender,
      clinicalNotes,
      diagnosis,
      specimenType,
    });

    return successResponse(result, "AI lab results generated");
  } catch (e: any) {
    log_src_app_api_pathology_ai_results_route.error("Pathology AI results error:", e);
    return errorResponse(e.message || "AI service error", 500);
  }
});
