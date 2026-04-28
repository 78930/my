import mongoose, { type InferSchemaType } from "mongoose";

const { Schema } = mongoose;

const workerProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    headline: { type: String, default: "" },
    skills: { type: [String], default: [] },
    preferredRoles: { type: [String], default: [] },
    experienceYears: { type: Number, default: 0 },
    certifications: { type: [String], default: [] },
    preferredAreas: { type: [String], default: [] },
    preferredShifts: { type: [String], default: [] },
    salaryMin: { type: Number, default: 0 },
    availability: { type: String, default: "Immediate" },
    isOpenToWork: { type: Boolean, default: true },
  },
  { timestamps: true }
);

workerProfileSchema.index({ skills: 1 });
workerProfileSchema.index({ preferredRoles: 1 });
workerProfileSchema.index({ preferredAreas: 1 });
workerProfileSchema.index({ preferredShifts: 1 });

export type WorkerProfileDocument = InferSchemaType<typeof workerProfileSchema> & { _id: string };
export const WorkerProfile =
  mongoose.models.WorkerProfile || mongoose.model("WorkerProfile", workerProfileSchema);

export default WorkerProfile;