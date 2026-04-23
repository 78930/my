import mongoose, { type InferSchemaType } from "mongoose";

const { Schema } = mongoose;

const HireSchema = new Schema(
  {
    application: {
      type: Schema.Types.ObjectId,
      ref: "Application",
      required: true,
      unique: true,
    },
    job: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    workerUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    factoryUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    proposedPay: {
      type: Number,
      required: true,
      min: 0,
    },
    joiningDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["OFFERED", "ACCEPTED", "REJECTED", "JOINED"],
      default: "OFFERED",
    },
  },
  { timestamps: true }
);

export type HireDocument = InferSchemaType<typeof HireSchema>;

const HireModel =
  mongoose.models.Hire || mongoose.model("Hire", HireSchema);

export default HireModel;