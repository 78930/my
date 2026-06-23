import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth, requireRole, type AuthRequest } from "../middleware/auth.js";
import WorkerProfileModel from "../models/WorkerProfile.js";
import ApplicationModel from "../models/Application.js";
import JobModel from "../models/Job.js";
import HireModel from "../models/Hire.js";
import UserModel from "../models/User.js";

const router = Router();

const updateWorkerProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  headline: z.string().optional(),
  skills: z.array(z.string()).optional(),
  preferredRoles: z.array(z.string()).optional(),
  experienceYears: z.number().min(0).optional(),
  certifications: z.array(z.string()).optional(),
  preferredAreas: z.array(z.string()).optional(),
  preferredShifts: z.array(z.string()).optional(),
  salaryMin: z.number().min(0).optional(),
  availability: z.string().optional(),
  isOpenToWork: z.boolean().optional(),
});

// GET /api/workers/search — public worker search for factories
router.get(
  "/search",
  asyncHandler(async (req, res) => {
    const { area, role, skill, shift, q, page: pageStr, limit: limitStr } = req.query as Record<string, string | undefined>;
    const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(limitStr ?? "20", 10) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { isOpenToWork: true };

    if (area) filter.preferredAreas = { $in: [new RegExp(area, "i")] };
    if (shift) filter.preferredShifts = { $in: [new RegExp(shift, "i")] };
    if (role) filter.preferredRoles = { $in: [new RegExp(role, "i")] };
    if (skill) filter.skills = { $in: [new RegExp(skill, "i")] };
    if (q) {
      filter.$or = [
        { fullName: { $regex: q, $options: "i" } },
        { headline: { $regex: q, $options: "i" } },
        { skills: { $in: [new RegExp(q, "i")] } },
      ];
    }

    const [workers, total] = await Promise.all([
      WorkerProfileModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      WorkerProfileModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);
    return res.json({
      items: workers,
      pagination: { page, limit, total, totalPages, hasMore: page < totalPages },
    });
  })
);

// GET /api/workers/me/profile — worker gets their own profile
router.get(
  "/me/profile",
  requireAuth,
  requireRole("WORKER"),
  asyncHandler<AuthRequest>(async (req, res) => {
    const profile = await WorkerProfileModel.findOne({ user: req.user!.id });
    if (!profile) {
      return res.status(404).json({ message: "Worker profile not found" });
    }
    return res.json(profile);
  })
);

// PUT /api/workers/me/profile — worker updates their profile
router.put(
  "/me/profile",
  requireAuth,
  requireRole("WORKER"),
  asyncHandler<AuthRequest>(async (req, res) => {
    const input = updateWorkerProfileSchema.parse(req.body);
    const profile = await WorkerProfileModel.findOneAndUpdate(
      { user: req.user!.id },
      input,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return res.json(profile);
  })
);

// GET /api/workers/me/applications — worker sees their own applications
router.get(
  "/me/applications",
  requireAuth,
  requireRole("WORKER"),
  asyncHandler<AuthRequest>(async (req, res) => {
    const applications = await ApplicationModel.find({ workerUser: req.user!.id })
      .sort({ createdAt: -1 })
      .lean();

    // Bulk-fetch jobs, hire records, and factory phone numbers to avoid N+1 queries
    const appIds = applications.map((a) => a._id);
    const jobIds = applications.map((a) => a.job);

    const [jobs, hires] = await Promise.all([
      JobModel.find({ _id: { $in: jobIds } })
        .populate("factoryProfile", "companyName hrName industrialAreas")
        .lean(),
      HireModel.find({ application: { $in: appIds } }).lean(),
    ]);

    const factoryUserIds = jobs.map((j) => j.factoryUser);
    const factoryUsers = await UserModel.find({ _id: { $in: factoryUserIds } }, "phone").lean();

    const jobMap = new Map(jobs.map((j) => [String(j._id), j]));
    const hireMap = new Map(hires.map((h) => [String(h.application), h]));
    const factoryPhoneMap = new Map(factoryUsers.map((u) => [String(u._id), u.phone]));

    const enriched = applications.map((app) => {
      const job = jobMap.get(String(app.job)) ?? null;
      return {
        ...app,
        job,
        hire: hireMap.get(String(app._id)) ?? null,
        factoryPhone: job ? (factoryPhoneMap.get(String((job as any).factoryUser)) ?? null) : null,
      };
    });

    return res.json({ items: enriched });
  })
);

// GET /api/workers/:id — public worker profile by id
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid worker id" });
    }

    const worker = await WorkerProfileModel.findById(id);
    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    return res.json(worker);
  })
);

export default router;
