import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth, requireRole, type AuthRequest } from "../middleware/auth.js";
import UserModel from "../models/User.js";
import WorkerProfileModel from "../models/WorkerProfile.js";
import DocumentModel from "../models/Document.js";
import { env } from "../config/env.js";
import { hashPassword } from "../utils/password.js";
import { sendPushToUser } from "../services/push.js";

const router = Router();

// POST /api/admin/bootstrap
// Creates the first admin user. Requires ADMIN_SECRET env var.
// Call once from a trusted terminal; then delete or rotate the secret.
router.post(
  "/bootstrap",
  asyncHandler(async (req, res) => {
    if (!env.adminSecret) {
      return res.status(503).json({ message: "Admin bootstrap is disabled (ADMIN_SECRET not set)." });
    }

    const { secret, name, phone } = z
      .object({
        secret: z.string().min(1),
        name: z.string().trim().min(2),
        phone: z.string().min(10),
      })
      .parse(req.body);

    if (secret !== env.adminSecret) {
      return res.status(403).json({ message: "Invalid admin secret." });
    }

    const normalizedPhone = phone.replace(/\D/g, "").slice(-10);

    const existing = await UserModel.findOne({ phone: normalizedPhone });
    if (existing) {
      existing.role = "ADMIN" as any;
      existing.name = name.trim();
      await existing.save();
      return res.json({ message: "Existing user promoted to ADMIN.", phone: normalizedPhone });
    }

    await UserModel.create({
      name: name.trim(),
      email: `${normalizedPhone}.admin@sketu.local`,
      phone: normalizedPhone,
      passwordHash: await hashPassword(normalizedPhone),
      role: "ADMIN",
    });

    return res.status(201).json({
      message: "Admin account created. Log in via OTP with this phone number.",
      phone: normalizedPhone,
    });
  })
);

// All routes below require a valid ADMIN JWT
const guard = [requireAuth, requireRole("ADMIN")];

// GET /api/admin/verifications?status=PENDING&page=1&limit=20
// Returns worker profiles filtered by verificationStatus, enriched with user phone.
router.get(
  "/verifications",
  ...guard,
  asyncHandler<AuthRequest>(async (req, res) => {
    const { status, page: pageStr, limit: limitStr } = req.query as Record<string, string | undefined>;

    const validStatuses = ["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"] as const;
    const filterStatus = validStatuses.includes(status as any) ? status : undefined;

    const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(limitStr ?? "20", 10) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (filterStatus) filter.verificationStatus = filterStatus;

    const [profiles, total] = await Promise.all([
      WorkerProfileModel.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      WorkerProfileModel.countDocuments(filter),
    ]);

    const userIds = profiles.map((p) => p.user);
    const [users, docCounts] = await Promise.all([
      UserModel.find({ _id: { $in: userIds } }, "phone name pushToken").lean(),
      DocumentModel.aggregate([
        { $match: { user: { $in: userIds } } },
        { $group: { _id: "$user", count: { $sum: 1 }, types: { $push: "$type" } } },
      ]),
    ]);
    const userMap = new Map(users.map((u) => [String(u._id), u]));
    const docMap = new Map(docCounts.map((d: any) => [String(d._id), { count: d.count, types: d.types }]));

    const enriched = profiles.map((p) => ({
      ...p,
      userPhone: userMap.get(String(p.user))?.phone ?? null,
      userName: userMap.get(String(p.user))?.name ?? null,
      docCount: docMap.get(String(p.user))?.count ?? 0,
      docTypes: docMap.get(String(p.user))?.types ?? [],
    }));

    const totalPages = Math.ceil(total / limit);
    return res.json({ items: enriched, pagination: { page, limit, total, totalPages, hasMore: page < totalPages } });
  })
);

// PATCH /api/admin/verifications/:profileId
// Approve or reject a worker's verification request.
// Body: { action: "APPROVE" | "REJECT", note?: string }
router.patch(
  "/verifications/:profileId",
  ...guard,
  asyncHandler<AuthRequest>(async (req, res) => {
    const { profileId } = req.params;
    if (!mongoose.isValidObjectId(profileId)) {
      return res.status(400).json({ message: "Invalid profile id." });
    }

    const { action, note } = z
      .object({
        action: z.enum(["APPROVE", "REJECT"]),
        note: z.string().max(500).default(""),
      })
      .parse(req.body);

    const newStatus = action === "APPROVE" ? "VERIFIED" : "REJECTED";

    const profile = await WorkerProfileModel.findByIdAndUpdate(
      profileId,
      { verificationStatus: newStatus, verificationNote: note },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ message: "Worker profile not found." });
    }

    const workerUser = await UserModel.findById(profile.user, "pushToken").lean();
    if (workerUser?.pushToken) {
      const title = action === "APPROVE" ? "Profile Verified!" : "Verification Update";
      const body = action === "APPROVE"
        ? "Your profile has been verified. You can now apply to jobs with a verified badge."
        : note
          ? `Your verification was not approved. Reason: ${note}`
          : "Your verification was not approved. Please update your profile and try again.";
      await sendPushToUser(workerUser.pushToken as string, title, body, { screen: "profile" });
    }

    return res.json({ message: `Profile ${newStatus.toLowerCase()}.`, profile });
  })
);

// GET /api/admin/workers/:workerId/documents — list all uploaded doc types for a worker
router.get(
  "/workers/:workerId/documents",
  ...guard,
  asyncHandler<AuthRequest>(async (req, res) => {
    const { workerId } = req.params;
    if (!mongoose.isValidObjectId(workerId)) {
      return res.status(400).json({ message: "Invalid worker id." });
    }
    const profile = await WorkerProfileModel.findById(workerId, "user").lean();
    if (!profile) return res.status(404).json({ message: "Worker profile not found." });

    const docs = await DocumentModel.find({ user: profile.user })
      .select("type mimeType updatedAt")
      .sort({ updatedAt: -1 })
      .lean();
    return res.json({ items: docs });
  })
);

// GET /api/admin/workers/:workerId/documents/:type — fetch one document with base64 for viewing
router.get(
  "/workers/:workerId/documents/:type",
  ...guard,
  asyncHandler<AuthRequest>(async (req, res) => {
    const { workerId, type } = req.params;
    if (!mongoose.isValidObjectId(workerId)) {
      return res.status(400).json({ message: "Invalid worker id." });
    }
    const profile = await WorkerProfileModel.findById(workerId, "user").lean();
    if (!profile) return res.status(404).json({ message: "Worker profile not found." });

    const doc = await DocumentModel.findOne({ user: profile.user, type }).lean();
    if (!doc) return res.status(404).json({ message: "Document not found." });

    return res.json(doc);
  })
);

export default router;
