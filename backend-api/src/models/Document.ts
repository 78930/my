import mongoose, { type InferSchemaType } from "mongoose";

const { Schema } = mongoose;

export const DOCUMENT_TYPES = ["AADHAAR", "PAN", "DRIVING_LICENSE", "BANK_PASSBOOK", "RESUME_PDF"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

const documentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: DOCUMENT_TYPES, required: true },
    imageBase64: { type: String, required: true },
    mimeType: { type: String, required: true, default: "image/jpeg" },
  },
  { timestamps: true }
);

// One document per type per user — upsert replaces on re-upload
documentSchema.index({ user: 1, type: 1 }, { unique: true });

export type DocumentRecord = InferSchemaType<typeof documentSchema>;

export default mongoose.models.Document || mongoose.model("Document", documentSchema);
