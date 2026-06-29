import twilio from "twilio";
import { logger } from "./logger";
import { recordExternalCall } from "../../src/lib/observability/metrics";
const log_backend_utils_sms = logger.child("backend/utils/sms");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

export const sendOTPviaSMS = async (mobile: string, otp: string) => {
  if (!accountSid || !authToken || !fromPhone) {
    log_backend_utils_sms.error({}, "[SMS] Twilio credentials not configured — skipping SMS");
    return;
  }

  // Ensure the mobile number has a country code (default to +91 for India)
  const to = mobile.startsWith("+") ? mobile : `+91${mobile.replace(/\D/g, "")}`;

  try {
    const start = Date.now();
    await client.messages.create({
      body: `Your MediNexPlus verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`,
      from: fromPhone,
      to,
    });
    recordExternalCall("twilio", Date.now() - start);
    log_backend_utils_sms.info({}, "OTP sent via SMS");
  } catch (error) {
    log_backend_utils_sms.error("[SMS] Failed to send OTP via SMS:", error);
  }
};
