import { env } from "../config/env.js";

function toE164(phone: string) {
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) {
    return `+${trimmed.replace(/[^\d]/g, "")}`;
  }
  return `${env.otpDefaultCountryCode}${trimmed.replace(/[^\d]/g, "")}`;
}

function getTwilioAuthHeader() {
  const credentials = `${env.twilioAccountSid}:${env.twilioAuthToken}`;
  return `Basic ${Buffer.from(credentials).toString("base64")}`;
}

export async function sendOtpSms(phone: string, code: string) {
  if (!env.twilioAccountSid || !env.twilioAuthToken || !env.twilioPhoneNumber) {
    if (env.nodeEnv === "production") {
      throw new Error("Twilio SMS is not configured");
    }
    return { delivered: false, reason: "missing_twilio_config" as const };
  }

  const to = toE164(phone);
  const from = env.twilioPhoneNumber;
  const body = `Your Sketu OTP is ${code}. It expires in 5 minutes.`;

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${env.twilioAccountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: getTwilioAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: to,
        From: from,
        Body: body,
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Twilio send failed (${response.status}): ${errorBody}`);
  }

  return { delivered: true as const };
}
