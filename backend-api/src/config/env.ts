import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 5000),
  mongoUri: required("MONGODB_URI"),
  jwtSecret: required("JWT_SECRET"),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "*",
  nodeEnv: process.env.NODE_ENV ?? "development",

  // Twilio for OTP
  twilioAccountSid: required("TWILIO_ACCOUNT_SID"),
  twilioAuthToken: required("TWILIO_AUTH_TOKEN"),
  twilioPhoneNumber: required("TWILIO_PHONE_NUMBER"),

  otpDefaultCountryCode: process.env.OTP_DEFAULT_COUNTRY_CODE ?? "+91",
  otpExpirySeconds: Number(process.env.OTP_EXPIRY_SECONDS ?? 300), // 5 minutes
};