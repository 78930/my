import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth, requireRole, type AuthRequest } from "../middleware/auth.js";
import ApplicationModel from "../models/Application.js";
import JobModel from "../models/Job.js";
import HireModel from "../models/Hire.js";
import WorkerProfileModel from "../models/WorkerProfile.js";
import UserModel from "../models/User.js";
import { sendPushToUser } from "../services/push.js";

const router = Router();

const hireSchema = z.object({
  proposedPay: z.number().min(0),
  joiningDate: z.string().optional(),
});

// GET /api/applications/:id — get a single application (factory sees applicant; worker sees own)
router.get(
  "/:id",
  requireAuth,
  asyncHandler<AuthRequest>(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid application id" });
    }

    const application = await ApplicationModel.findById(req.params.id).lean();
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const role = req.user!.role;

    if (role === "WORKER") {
      if (String(application.workerUser) !== String(req.user!.id)) {
        return res.status(403).json({ message: "Not allowed" });
      }

      const [job, hire] = await Promise.all([
        JobModel.findById(application.job)
          .populate("factoryProfile", "companyName hrName industrialAreas")
          .lean(),
        HireModel.findOne({ application: application._id }).lean(),
      ]);

      const factoryUser = job ? await UserModel.findById((job as any).factoryUser, "phone").lean() : null;

      return res.json({
        ...application,
        job,
        hire: hire ?? null,
        factoryPhone: factoryUser?.phone ?? null,
      });
    }

    if (role === "FACTORY") {
      const job = await JobModel.findOne({ _id: application.job, factoryUser: req.user!.id });
      if (!job) {
        return res.status(403).json({ message: "Not allowed" });
      }

      const [workerProfile, workerUser] = await Promise.all([
        WorkerProfileModel.findOne({ user: application.workerUser }).lean(),
        UserModel.findById(application.workerUser, "phone").lean(),
      ]);

      return res.json({
        ...application,
        workerProfile: workerProfile ?? null,
        workerPhone: workerUser?.phone ?? null,
      });
    }

    return res.status(403).json({ message: "Not allowed" });
  })
);

// PATCH /api/applications/:id/respond — worker accepts or rejects a hire offer
router.patch(
  "/:id/respond",
  requireAuth,
  requireRole("WORKER"),
  asyncHandler<AuthRequest>(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid application id" });
    }

    const { decision } = z.object({
      decision: z.enum(["ACCEPTED", "REJECTED"]),
    }).parse(req.body);

    const application = await ApplicationModel.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    if (String(application.workerUser) !== String(req.user!.id)) {
      return res.status(403).json({ message: "Not allowed" });
    }
    if (application.status !== "HIRED") {
      return res.status(409).json({ message: "Only HIRED applications can be responded to" });
    }

    const hire = await HireModel.findOne({ application: application._id });
    if (!hire) {
      return res.status(404).json({ message: "Hire offer not found" });
    }
    if (hire.status !== "OFFERED") {
      return res.status(409).json({ message: "Offer has already been responded to" });
    }

    hire.status = decision;
    await hire.save();

    return res.json(hire);
  })
);

router.post(
  "/:id/shortlist",
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
      return res.status(409).json({ message: "Cannot shortlist an already hired applicant." });
    }

    application.status = "SHORTLISTED";
    await application.save();

    // Notify worker — reuse the already-fetched `job` for the title
    const workerUserForNotify = await UserModel.findById(application.workerUser, "pushToken").lean();
    await sendPushToUser(
      (workerUserForNotify as any)?.pushToken,
      "You've been shortlisted!",
      `Great news — you've been shortlisted for ${job.title ?? "a job"}.`,
      { applicationId: String(application._id), type: "SHORTLISTED" }
    );

    return res.json(application);
  })
);

router.post(
  "/:id/hire",
  requireAuth,
  requireRole("FACTORY"),
  asyncHandler<AuthRequest>(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid application id" });
    }
    const input = hireSchema.parse(req.body);
    const application = await ApplicationModel.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const job = await JobModel.findOne({ _id: application.job, factoryUser: req.user!.id });
    if (!job) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (application.status === "REJECTED") {
      return res.status(409).json({ message: "Cannot hire a rejected applicant. Shortlist them first." });
    }

    application.status = "HIRED";
    await application.save();

    // Notify worker of hire offer — reuse already-fetched `job`
    const workerUserForHireNotify = await UserModel.findById(application.workerUser, "pushToken").lean();
    await sendPushToUser(
      (workerUserForHireNotify as any)?.pushToken,
      "You've received a hire offer!",
      `Congratulations! You've been offered the role of ${job.title ?? "a job"}. Tap to view details.`,
      { applicationId: String(application._id), type: "HIRED" }
    );

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

    const workerUserForRejectNotify = await UserModel.findById(application.workerUser, "pushToken").lean();
    await sendPushToUser(
      (workerUserForRejectNotify as any)?.pushToken,
      "Application update",
      `Your application for ${job.title ?? "a role"} was not taken forward this time.`,
      { applicationId: String(application._id), type: "REJECTED" }
    );

    return res.json(application);
  })
);

export default router;