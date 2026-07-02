import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth, requireRole, type AuthRequest } from "../middleware/auth.js";
import FactoryProfileModel from "../models/FactoryProfile.js";
import JobModel from "../models/Job.js";
import ApplicationModel from "../models/Application.js";
import HireModel from "../models/Hire.js";

const router = Router();

const upsertFactoryProfileSchema = z.object({
  companyName: z.string().min(2).optional(),
  hrName: z.string().min(2).optional(),
  industrialAreas: z.array(z.string()).optional(),
  companySize: z.string().optional(),
  description: z.string().optional(),
});

router.get(
  "/me/profile",
  requireAuth,
  requireRole("FACTORY"),
  asyncHandler<AuthRequest>(async (req, res) => {
    const profile = await FactoryProfileModel.findOne({ user: req.user!.id });
    if (!profile) {
      return res.status(404).json({ message: "Factory profile not found" });
    }
    return res.json(profile);
  })
);

router.put(
  "/me/profile",
  requireAuth,
  requireRole("FACTORY"),
  asyncHandler<AuthRequest>(async (req, res) => {
    const input = upsertFactoryProfileSchema.parse(req.body);
    const profile = await FactoryProfileModel.findOneAndUpdate(
      { user: req.user!.id },
      input,
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );
    return res.json(profile);
  })
);

router.get(
  "/jobs",
  requireAuth,
  requireRole("FACTORY"),
  asyncHandler<AuthRequest>(async (req, res) => {
    const { status, page: pageStr, limit: limitStr } = req.query as Record<string, string | undefined>;
    const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitStr ?? "50", 10) || 50));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { factoryUser: req.user!.id };
    if (status) query.status = status;

    const [jobs, total] = await Promise.all([
      JobModel.find(query)
        .populate("factoryProfile", "companyName hrName industrialAreas")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      JobModel.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);
    return res.json({
      items: jobs,
      pagination: { page, limit, total, totalPages, hasMore: page < totalPages },
    });
  })
);

router.get(
  "/dashboard/summary",
  requireAuth,
  requireRole("FACTORY"),
  asyncHandler<AuthRequest>(async (req, res) => {
    const profile = await FactoryProfileModel.findOne({ user: req.user!.id });
    if (!profile) {
      return res.status(404).json({ message: "Factory profile not found" });
    }

    const jobs = await JobModel.find({ factoryUser: req.user!.id });
    const jobIds = jobs.map((job) => job._id);

    const [openJobs, applications, shortlisted, hires] = await Promise.all([
      JobModel.countDocuments({ factoryUser: req.user!.id, status: "OPEN" }),
      ApplicationModel.countDocuments({ job: { $in: jobIds } }),
      ApplicationModel.countDocuments({ job: { $in: jobIds }, status: { $in: ["SHORTLISTED", "HIRED"] } }),
      HireModel.countDocuments({ factoryUser: req.user!.id }),
    ]);

    return res.json({
      openJobs,
      totalApplications: applications,
      shortlisted,
      hires,
    });
  })
);

export default router;