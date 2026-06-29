import { NextRequest, NextResponse } from "next/server";
import { logger } from "../../../../../backend/utils/logger";
import { streamTranscription } from "@/../../backend/services/voice-prescription.service";
import { authMiddleware } from "@/../../backend/middlewares/auth.middleware";
import { withApiRoute } from "../../../../../backend/utils/api-route";
const log_src_app_api_prescriptions_voice_stream_route = logger.child("src/app/api/prescriptions/voice-stream/route");

export const POST = withApiRoute("prescriptions.voice-stream.post", async (req: NextRequest) => {
  try {
    const authResult = await authMiddleware(req);
    if (authResult.error || !authResult.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { role } = authResult.user;

    if (role !== "DOCTOR") {
      return NextResponse.json({ success: false, message: "Only doctors can use voice prescription" }, { status: 403 });
    }

    const body = await req.json();
    const { audioChunk, patientName, doctorName, previousTranscript } = body;

    if (!audioChunk || !patientName || !doctorName) {
      return NextResponse.json(
        { success: false, message: "Audio chunk, patient name, and doctor name are required" },
        { status: 400 }
      );
    }

    const result = await streamTranscription(audioChunk, {
      patientName,
      doctorName,
      previousTranscript,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    log_src_app_api_prescriptions_voice_stream_route.error("Voice stream API error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process audio stream" },
      { status: 500 }
    );
  }
});
