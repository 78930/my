import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth, requireRole, type AuthRequest } from "../middleware/auth.js";
import FactoryProfileModel from "../models/FactoryProfile.js";
import JobModel from "../models/Job.js";
import WorkerProfileModel from "../models/WorkerProfile.js";
import ApplicationModel from "../models/Application.js";

const router = Router();

const createJobSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(10),
  area: z.string().min(1),
  shift: z.string().min(1),
  skillsRequired: z.array(z.string()).default([]),
  payMin: z.number().min(0).default(0),
  payMax: z.number().min(0).default(0),
  employmentType: z.string().default("Full-time"),
});

// GET /api/jobs — public list with filters
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { area, role, skill, shift, q } = req.query as Record<string, string | undefined>;

    const filter: Record<string, unknown> = { status: "OPEN" };

    if (area) filter.area = { $regex: area, $options: "i" };
    if (shift) filter.shift = { $regex: shift, $options: "i" };
    if (role) filter.title = { $regex: role, $options: "i" };
    if (skill) filter.skillsRequired = { $in: [new RegExp(skill, "i")] };
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { area: { $regex: q, $options: "i" } },
      ];
    }

    const jobs = await JobModel.find(filter)
      .populate("factoryProfile", "companyName hrName industrialAreas description")
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({ items: jobs });
  })
);

// GET /api/jobs/:id — public job detail
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid job id" });
    }

    const job = await JobModel.findById(id).populate(
      "factoryProfile",
      "companyName hrName industrialAreas description"
    );

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    return res.json(job);
  })
);

// POST /api/jobs — factory creates a job
router.post(
  "/",
  requireAuth,
  requireRole("FACTORY"),
  asyncHandler<AuthRequest>(async (req, res) => {
    const input = createJobSchema.parse(req.body);

    const factoryProfile = await FactoryProfileModel.findOne({ user: req.user!.id });
    if (!factoryProfile) {
      return res.status(404).json({ message: "Factory profile not found" });
    }

    const job = await JobModel.create({
      ...input,
      factoryUser: req.user!.id,
      factoryProfile: factoryProfile._id,
    });

    return res.status(201).json(job);
  })
);

// POST /api/jobs/:id/apply — worker applies to a job
router.post(
  "/:id/apply",
  requireAuth,
  requireRole("WORKER"),
  asyncHandler<AuthRequest>(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid job id" });
    }

    const job = await JobModel.findById(id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    if (job.status !== "OPEN") {
      return res.status(409).json({ message: "This job is no longer accepting applications" });
    }

    const existing = await ApplicationModel.findOne({ job: id, workerUser: req.user!.id });
    if (existing) {
      return res.status(409).json({ message: "You have already applied to this job" });
    }

    const note = typeof req.body?.note === "string" ? req.body.note : "";

    const application = await ApplicationModel.create({
      job: id,
      workerUser: req.user!.id,
      note,
    });

    return res.status(201).json(application);
  })
);

// PATCH /api/jobs/:id — factory updates or closes their job
router.patch(
  "/:id",
  requireAuth,
  requireRole("FACTORY"),
  asyncHandler<AuthRequest>(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid job id" });
    }

    const job = await JobModel.findOne({ _id: id, factoryUser: req.user!.id });
    if (!job) {
      return res.status(404).json({ message: "Job not found or not yours" });
    }

    const allowed = ["title", "description", "area", "shift", "skillsRequired", "payMin", "payMax", "employmentType", "status"] as const;
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in req.body) updates[key] = req.body[key];
    }

    if (updates.status && !["OPEN", "CLOSED"].includes(updates.status as string)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updated = await JobModel.findByIdAndUpdate(id, updates, { new: true }).populate(
      "factoryProfile",
      "companyName hrName industrialAreas description"
    );

    return res.json(updated);
  })
);

// POST /api/jobs/:id/shortlist-worker — factory initiates shortlist for a worker (no prior application needed)
router.post(
  "/:id/shortlist-worker",
  requireAuth,
  requireRole("FACTORY"),
  asyncHandler<AuthRequest>(async (req, res) => {
    const { id } = req.params;
    const { workerProfileId } = req.body as { workerProfileId?: string };

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid job id" });
    }
    if (!workerProfileId || !mongoose.isValidObjectId(workerProfileId)) {
      return res.status(400).json({ message: "workerProfileId is required" });
    }

    const job = await JobModel.findOne({ _id: id, factoryUser: req.user!.id });
    if (!job) {
      return res.status(404).json({ message: "Job not found or not yours" });
    }

    const workerProfile = await WorkerProfileModel.findById(workerProfileId);
    if (!workerProfile) {
      return res.status(404).json({ message: "Worker profile not found" });
    }

    // Upsert: create application if none exists, then set status to SHORTLISTED
    const application = await ApplicationModel.findOneAndUpdate(
      { job: id, workerUser: workerProfile.user },
      { job: id, workerUser: workerProfile.user, status: "SHORTLISTED", note: "" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json(application);
  })
);

// GET /api/jobs/:id/applications — factory sees applicants for their job
router.get(
  "/:id/applications",
  requireAuth,
  requireRole("FACTORY"),
  asyncHandler<AuthRequest>(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid job id" });
    }

    const job = await JobModel.findOne({ _id: id, factoryUser: req.user!.id });
    if (!job) {
      return res.status(404).json({ message: "Job not found or not yours" });
    }

    const applications = await ApplicationModel.find({ job: id })
      .sort({ createdAt: -1 })
      .lean();

    // Attach worker profile to each application
    const enriched = await Promise.all(
      applications.map(async (app) => {
        const workerProfile = await WorkerProfileModel.findOne({ user: app.workerUser }).lean();
        return { ...app, workerProfile };
      })
    );

    return res.json({ items: enriched });
  })
);

export default router;
