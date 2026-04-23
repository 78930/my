import mongoose, { type InferSchemaType } from "mongoose";

const { Schema } = mongoose;

const factoryProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    companyName: { type: String, required: true, trim: true },
    hrName: { type: String, required: true, trim: true },
    industrialAreas: { type: [String], default: [] },
    companySize: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

export type FactoryProfileDocument = InferSchemaType<typeof factoryProfileSchema> & { _id: string };
export const FactoryProfile =
  mongoose.models.FactoryProfile || mongoose.model("FactoryProfile", factoryProfileSchema);

export default FactoryProfile;
