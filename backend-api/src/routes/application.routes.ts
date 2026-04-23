import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth, requireRole, type AuthRequest } from "../middleware/auth.js";
import ApplicationModel from "../models/Application.js";
import JobModel from "../models/Job.js";
import HireModel from "../models/Hire.js";

const router = Router();

const hireSchema = z.object({
  proposedPay: z.number().min(0),
  joiningDate: z.string().optional(),
});

router.post(
  "/:id/shortlist",
  requireAuth,
  requireRole("FACTORY"),
  asyncHandler<AuthRequest>(async (req, res) => {
    const application = await ApplicationModel.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const job = await JobModel.findOne({ _id: application.job, factoryUser: req.user!.id });
    if (!job) {
      return res.status(403).json({ message: "Not allowed" });
    }

    application.status = "SHORTLISTED";
    await application.save();
    return res.json(application);
  })
);

router.post(
  "/:id/hire",
  requireAuth,
  requireRole("FACTORY"),
  asyncHandler<AuthRequest>(async (req, res) => {
    const input = hireSchema.parse(req.body);
    const application = await ApplicationModel.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const job = await JobModel.findOne({ _id: application.job, factoryUser: req.user!.id });
    if (!job) {
      return res.status(403).json({ message: "Not allowed" });
    }

    application.status = "HIRED";
    await application.save();

    const hire = await HireModel.findOneAndUpdate(
      { application: application._id },
      {
        application: application._id,
        job: application.job,
        workerUser: application.workerUser,
        factoryUser: req.user!.id,
        proposedPay: input.proposedPay,
        joiningDate: input.joiningDate ? new Date(input.joiningDate) : undefined,
        status: "OFFERED",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json(hire);
  })
);

export default router;