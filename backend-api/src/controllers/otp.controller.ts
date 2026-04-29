// src/controllers/otp.controller.ts
import { Request, Response } from "express";
import twilio from "twilio";
import { env } from "../config/env.js";

const otpStore = new Map<string, { otp: string; expiresAt: number }>();

const client = twilio(env.twilioAccountSid, env.twilioAuthToken);

function normalizePhone(phone: string) {
  let cleaned = phone.trim().replace(/\s+/g, "");

  if (!cleaned.startsWith("+")) {
    cleaned = `${env.otpDefaultCountryCode}${cleaned}`;
  }

  return cleaned;
}

export async function sendOtp(req: Request, res: Response) {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const to = normalizePhone(phone);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore.set(to, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    await client.messages.create({
      body: `Your Sketu OTP is ${otp}. It expires in 5 minutes.`,
      from: env.twilioPhoneNumber,
      to,
    });

    return res.json({
      message: "OTP sent successfully",
    });
  } catch (error: any) {
    console.error("Twilio OTP error:", error?.message || error);

    return res.status(500).json({
      message: "Failed to send OTP",
      error: error?.message,
    });
  }
}

export async function verifyOtp(req: Request, res: Response) {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        message: "Phone and OTP are required",
      });
    }

    const to = normalizePhone(phone);
    const savedOtp = otpStore.get(to);

    if (!savedOtp) {
      return res.status(400).json({
        message: "OTP not found or expired",
      });
    }

    if (Date.now() > savedOtp.expiresAt) {
      otpStore.delete(to);
      return res.status(400).json({
        message: "OTP expired",
      });
    }

    if (savedOtp.otp !== otp) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    otpStore.delete(to);

    return res.json({
      message: "OTP verified successfully",
      user: {
        phone: to,
      },
    });
  } catch (error: any) {
    console.error("Verify OTP error:", error?.message || error);

    return res.status(500).json({
      message: "OTP verification failed",
    });
  }
}