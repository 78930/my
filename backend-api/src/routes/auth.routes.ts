import { Router } from "express";
import { randomInt } from "crypto";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import UserModel from "../models/User.js";
import WorkerProfileModel from "../models/WorkerProfile.js";
import FactoryProfileModel from "../models/FactoryProfile.js";
import { hashPassword } from "../utils/password.js";
import { signAccessToken } from "../utils/jwt.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { env } from "../config/env.js";
import { sendOtpSms } from "../services/sms.js";

const router = Router();

const phoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .refine((value) => normalizePhone(value).length >= 10, {
    message: "Phone number must have at least 10 digits",
  });

const registerSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("WORKER"),
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    phone: phoneSchema,
  }),
  z.object({
    role: z.literal("FACTORY"),
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    phone: phoneSchema,
  }),
]);

const loginSchema = z.object({
  role: z.enum(["WORKER", "FACTORY"]),
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  phone: phoneSchema,
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
  const digits = phone.replace(/\D/g, "");
  // Strip 91 country code prefix so +919876543210, 919876543210, 9876543210 all resolve to the same 10-digit key
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

function buildAccountEmail(phone: string, role: "WORKER" | "FACTORY") {
  return `${phone}.${role.toLowerCase()}@sketu.local`;
}

function createAuthResponse(user: { _id: unknown; role: "WORKER" | "FACTORY" | "ADMIN"; email: string; phone?: string }) {
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
    const phone = normalizePhone(input.phone);
    const name = input.name.trim();

    const existing = await UserModel.findOne({ phone, role: input.role });
    if (existing) {
      return res.status(409).json({ message: "An account with this phone number already exists. Please log in instead." });
    }

    const user = await UserModel.create({
      name,
      email: buildAccountEmail(phone, input.role),
      phone,
      passwordHash: await hashPassword(phone),
      role: input.role,
    });

    if (input.role === "WORKER") {
      await WorkerProfileModel.create({
        user: user._id,
        fullName: name,
      });
    } else {
      await FactoryProfileModel.create({
        user: user._id,
        companyName: name,
        hrName: name,
      });
    }

    return res.status(201).json(createAuthResponse(user));
  })
);

async function nameMatchesAccount(
  user: { _id: unknown; role: "WORKER" | "FACTORY"; name?: string },
  inputName: string
) {
  const wanted = normalizeName(inputName);
  if (user.name && normalizeName(user.name) === wanted) {
    return true;
  }

  if (user.role === "WORKER") {
    const profile = await WorkerProfileModel.findOne({ user: user._id }).select("fullName");
    return Boolean(profile?.fullName && normalizeName(profile.fullName) === wanted);
  }

  const profile = await FactoryProfileModel.findOne({ user: user._id }).select("companyName hrName");
  if (!profile) {
    return false;
  }

  return (
    normalizeName(profile.companyName) === wanted ||
    normalizeName(profile.hrName) === wanted
  );
}

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const phone = normalizePhone(input.phone);

    const user = await UserModel.findOne({ phone, role: input.role });

    if (!user) {
      return res.status(401).json({
        message: "No account found. Please create an account first.",
      });
    }

    if (!(await nameMatchesAccount(user, input.name))) {
      return res.status(401).json({ message: "Name does not match this phone number" });
    }

    return res.json(createAuthResponse(user));
  })
);

router.post(
  "/request-otp",
  asyncHandler(async (req, res) => {
    const input = requestOtpSchema.parse(req.body);
    const phone = normalizePhone(input.phone);

    // Always return 200 regardless of whether the phone is registered (prevents user enumeration)
    const genericResponse = {
      message: "If this number is registered, you will receive an OTP shortly.",
      expiresInSeconds: 300,
    };

    const user = await UserModel.findOne({ phone });
    if (!user) {
      return res.json(genericResponse);
    }

    const code = String(randomInt(100000, 1000000));
    otpStore.set(phone, {
      code,
      attempts: 0,
      expiresAt: Date.now() + env.otpExpirySeconds * 1000,
    });

    try {
      const smsResult = await sendOtpSms(phone, code);
      if (!smsResult.delivered) {
        console.warn(`[OTP] SMS not delivered (${smsResult.reason}) for ${phone}.`);
      }
    } catch (error) {
      console.error("[OTP] SMS send failed", error);
      // Still return 200 — don't leak that the number exists
      return res.json(genericResponse);
    }

    return res.json({
      ...genericResponse,
      ...(env.nodeEnv !== "production" ? { otpCode: code } : {}),
    });
  })
);

router.post(
  "/verify-login-otp",
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
      "email phone role name photoBase64 photoMimeType createdAt"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const profile =
      user.role === "WORKER"
        ? await WorkerProfileModel.findOne({ user: user._id })
        : user.role === "FACTORY"
        ? await FactoryProfileModel.findOne({ user: user._id })
        : null; // ADMIN has no profile document

    return res.json({ user, profile });
  })
);

// POST /api/auth/me/photo — upload or replace profile photo
router.post(
  "/me/photo",
  requireAuth,
  asyncHandler<AuthRequest>(async (req, res) => {
    const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
    const { photoBase64, mimeType } = z
      .object({
        photoBase64: z.string().min(100).max(10_000_000),
        mimeType: z.enum(ALLOWED_IMAGE_TYPES).default("image/jpeg"),
      })
      .parse(req.body);

    await UserModel.findByIdAndUpdate(req.user!.id, {
      photoBase64,
      photoMimeType: mimeType,
    });

    return res.json({ message: "Profile photo saved." });
  })
);

export default router;
