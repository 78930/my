import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import UserModel from "../models/User.js";
import WorkerProfileModel from "../models/WorkerProfile.js";
import FactoryProfileModel from "../models/FactoryProfile.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { signAccessToken } from "../utils/jwt.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();

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
      phone: input.phone,
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

    const token = signAccessToken({
      sub: String(user._id),
      role: user.role,
      email: user.email,
    });

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        role: user.role,
        email: user.email,
        phone: user.phone,
      },
    });
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

    const token = signAccessToken({
      sub: String(user._id),
      role: user.role,
      email: user.email,
    });

    return res.json({
      token,
      user: {
        id: user._id,
        role: user.role,
        email: user.email,
        phone: user.phone,
      },
    });
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
