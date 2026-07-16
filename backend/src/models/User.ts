import mongoose, { Schema, Document, Types } from "mongoose";

export type UserRole = "business_owner" | "admin";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  mobile: string;
  passwordHash?: string;
  role: UserRole;
  isVerified: boolean;
  otp?: string;
  otpExpiry?: Date;
  refreshTokenHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    mobile: {
      type: String,
      required: true,
      unique: true,
      index: true,
      match: /^[0-9]{10,15}$/,
    },
    passwordHash: { type: String, select: false },
    role: {
      type: String,
      enum: ["business_owner", "admin"],
      default: "business_owner",
    },
    isVerified: { type: Boolean, default: false },
    otp: { type: String, select: false },
    otpExpiry: { type: Date, select: false },
    refreshTokenHash: { type: String, select: false },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", UserSchema);
