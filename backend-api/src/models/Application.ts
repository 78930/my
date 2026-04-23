import mongoose from "mongoose";

const { Schema } = mongoose;

const ApplicationSchema = new Schema(
  {
    job: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    workerUser: { type: Schema.Types.ObjectId, ref: "User", required: true },
    note: { type: String, default: "" },
    status: {
      type: String,
      enum: ["APPLIED", "SHORTLISTED", "HIRED", "REJECTED"],
      default: "APPLIED",
    },
  },
  { timestamps: true }
);

// Prevent a worker from applying to the same job twice
ApplicationSchema.index({ job: 1, workerUser: 1 }, { unique: true });

const ApplicationModel =
  mongoose.models.Application ||
  mongoose.model("Application", ApplicationSchema);

export default ApplicationModel;
