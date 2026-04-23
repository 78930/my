import mongoose, { type InferSchemaType } from "mongoose";

const { Schema } = mongoose;

const jobSchema = new Schema(
  {
    factoryUser: { type: Schema.Types.ObjectId, ref: "User", required: true },
    factoryProfile: { type: Schema.Types.ObjectId, ref: "FactoryProfile", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    area: { type: String, required: true, trim: true },
    shift: { type: String, required: true, trim: true },
    skillsRequired: { type: [String], default: [] },
    payMin: { type: Number, default: 0 },
    payMax: { type: Number, default: 0 },
    employmentType: { type: String, default: "Full-time" },
    status: { type: String, enum: ["OPEN", "PAUSED", "CLOSED"], default: "OPEN" },
  },
  { timestamps: true }
);

jobSchema.index({ area: 1, title: 1, shift: 1, skillsRequired: 1, status: 1 });

export type JobDocument = InferSchemaType<typeof jobSchema> & { _id: string };
export const Job =
  mongoose.models.Job || mongoose.model("Job", jobSchema);

export default Job;
