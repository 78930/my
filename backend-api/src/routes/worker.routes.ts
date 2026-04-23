import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth, requireRole, type AuthRequest } from "../middleware/auth.js";
import WorkerProfileModel from "../models/WorkerProfile.js";
import ApplicationModel from "../models/Application.js";
import JobModel from "../models/Job.js";

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
    const { area, role, skill, shift, q } = req.query as Record<string, string | undefined>;

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

    const workers = await WorkerProfileModel.find(filter).sort({ createdAt: -1 }).limit(100);

    return res.json({ items: workers });
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

    const enriched = await Promise.all(
      applications.map(async (app) => {
        const job = await JobModel.findById(app.job)
          .populate("factoryProfile", "companyName hrName industrialAreas")
          .lean();
        return { ...app, job };
      })
    );

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
