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
<<<<<<< HEAD
  nodeEnv: process.env.NODE_ENV ?? "development",
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? "",
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER ?? "",
  otpDefaultCountryCode: process.env.OTP_DEFAULT_COUNTRY_CODE ?? "+91",
};
   
=======
};
>>>>>>> 5c0caeb4c7685069d55b1ae0abb69aceeba0ca1e
