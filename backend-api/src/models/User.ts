import mongoose, { type InferSchemaType } from "mongoose";

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, default: "" },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["WORKER", "FACTORY"], required: true },
  },
  { timestamps: true }
);

export type UserDocument = InferSchemaType<typeof UserSchema>;

const User =
  mongoose.models.User || mongoose.model("User", UserSchema);

export default User;
