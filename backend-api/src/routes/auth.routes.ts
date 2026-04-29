import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import UserModel from "../models/User.js";
import WorkerProfileModel from "../models/WorkerProfile.js";
import FactoryProfileModel from "../models/FactoryProfile.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { signAccessToken } from "../utils/jwt.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { env } from "../config/env.js";
import { sendOtpSms } from "../services/sms.js";
import { sendOtp, verifyOtp } from "../controllers/otp.controller.js";

const router = Router();


router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);


const registerSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("WORKER"),
    fullName: z.string().min(2),
    email: z.email(),
    phone: z.string().min(10),
    password: z.string().min(8),
    preferredAreas: z.array(z.string()).default([]),
    preferredRoles: z.array(z.string()).default([]),
    skills: z.array(z.string()).default([]),
    preferredShifts: z.array(z.string()).default([]),
  }),
  z.object({
    role: z.literal("FACTORY"),
    companyName: z.string().min(2),
    hrName: z.string().min(2),
    email: z.email(),
    phone: z.string().min(10),
    password: z.string().min(8),
    industrialAreas: z.array(z.string()).default([]),
    description: z.string().default(""),
  }),
]);

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});
const requestOtpSchema = z.object({
  phone: z.string().min(10),
});
const verifyOtpSchema = z.object({
  phone: z.string().min(10),
  otp: z.string().length(6),
});
const otpStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

function createAuthResponse(user: { _id: unknown; role: "WORKER" | "FACTORY"; email: string; phone?: string }) {
  const token = signAccessToken({
    sub: String(user._id),
    role: user.role,
    email: user.email,
  });

  return {
    token,
    user: {
      id: user._id,
      role: user.role,
      email: user.email,
      phone: user.phone,
    },
  };
}

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const input = registerSchema.parse(req.body);

    const existing = await UserModel.findOne({ email: input.email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const user = await UserModel.create({
      name: input.role === "WORKER" ? input.fullName : input.hrName,
      email: input.email.toLowerCase(),
      phone: normalizePhone(input.phone),
      passwordHash: await hashPassword(input.password),
      role: input.role,
    });

    if (input.role === "WORKER") {
      await WorkerProfileModel.create({
        user: user._id,
        fullName: input.fullName,
        skills: input.skills,
        preferredRoles: input.preferredRoles,
        preferredAreas: input.preferredAreas,
        preferredShifts: input.preferredShifts,
      });
    } else {
      await FactoryProfileModel.create({
        user: user._id,
        companyName: input.companyName,
        hrName: input.hrName,
        industrialAreas: input.industrialAreas,
        description: input.description,
      });
    }

    return res.status(201).json(createAuthResponse(user));
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const user = await UserModel.findOne({ email: input.email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await comparePassword(input.password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.json(createAuthResponse(user));
  })
);

router.post(
  "/request-otp",
  asyncHandler(async (req, res) => {
    const input = requestOtpSchema.parse(req.body);
    const phone = normalizePhone(input.phone);
    const user = await UserModel.findOne({ phone });

    if (!user) {
      return res.status(404).json({ message: "No account found for this phone number" });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    otpStore.set(phone, {
      code,
      attempts: 0,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    try {
      const smsResult = await sendOtpSms(phone, code);
      if (!smsResult.delivered) {
        console.warn(`[OTP] SMS not delivered (${smsResult.reason}) for ${phone}.`);
      }
    } catch (error) {
      console.error("[OTP] SMS send failed", error);
      return res.status(502).json({ message: "Unable to send OTP SMS. Please try again." });
    }

    console.log(`[OTP] ${phone} code generated`);

    return res.json({
      message: "OTP sent successfully",
      expiresInSeconds: 300,
      ...(process.env.nodeEnv !== "production" ? { otpCode: code } : {}),
    });
  })
);

router.post(
  "/verify-otp",
  asyncHandler(async (req, res) => {
    const input = verifyOtpSchema.parse(req.body);
    const phone = normalizePhone(input.phone);
    const otpState = otpStore.get(phone);

    if (!otpState || otpState.expiresAt < Date.now()) {
      otpStore.delete(phone);
      return res.status(400).json({ message: "OTP expired. Request a new OTP." });
    }

    if (otpState.code !== input.otp) {
      otpState.attempts += 1;
      if (otpState.attempts >= 5) {
        otpStore.delete(phone);
        return res.status(429).json({ message: "Too many invalid attempts. Request a new OTP." });
      }
      otpStore.set(phone, otpState);
      return res.status(401).json({ message: "Invalid OTP" });
    }

    const user = await UserModel.findOne({ phone });
    otpStore.delete(phone);

    if (!user) {
      return res.status(404).json({ message: "No account found for this phone number" });
    }

    return res.json(createAuthResponse(user));
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler<AuthRequest>(async (req, res) => {
    const user = await UserModel.findById(req.user!.id).select(
      "email phone role isActive createdAt"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const profile =
      user.role === "WORKER"
        ? await WorkerProfileModel.findOne({ user: user._id })
        : await FactoryProfileModel.findOne({ user: user._id });

    return res.json({ user, profile });
  })
);

export default router;
