import { Router } from "express";
import mongoose from "mongoose";
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

router.post(
  "/:id/reject",
  requireAuth,
  requireRole("FACTORY"),
  asyncHandler<AuthRequest>(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid application id" });
    }

    const application = await ApplicationModel.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const job = await JobModel.findOne({ _id: application.job, factoryUser: req.user!.id });
    if (!job) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (application.status === "HIRED") {
      return res.status(409).json({ message: "Cannot reject an already hired application" });
    }

    application.status = "REJECTED";
    await application.save();
    return res.json(application);
  })
);

export default router;