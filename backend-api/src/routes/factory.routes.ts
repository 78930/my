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
    const { status } = req.query as Record<string, string | undefined>;
    const query: Record<string, unknown> = { factoryUser: req.user!.id };
    if (status) query.status = status;

    const jobs = await JobModel.find(query)
      .populate("factoryProfile", "companyName hrName industrialAreas")
      .sort({ createdAt: -1 });

    return res.json({ items: jobs });
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
      ApplicationModel.countDocuments({ job: { $in: jobIds }, status: "SHORTLISTED" }),
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