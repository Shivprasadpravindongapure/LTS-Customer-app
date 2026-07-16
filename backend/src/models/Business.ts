import mongoose, { Schema, Document, Types } from "mongoose";

export type PlanTier = "free" | "silver" | "premium";

export interface IWorkingHours {
  day: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
  open: string; // "09:00"
  close: string; // "18:00"
  closed: boolean;
}

export interface IBusiness extends Document {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  name: string;
  category: Types.ObjectId;
  subCategory?: Types.ObjectId;
  description: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    country: string;
    pincode?: string;
  };
  location?: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  photos: string[];
  workingHours: IWorkingHours[];
  contactNumbers: string[];
  whatsappEnabled: boolean;
  plan: PlanTier;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WorkingHoursSchema = new Schema<IWorkingHours>(
  {
    day: {
      type: String,
      enum: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      required: true,
    },
    open: { type: String, default: "09:00" },
    close: { type: String, default: "18:00" },
    closed: { type: Boolean, default: false },
  },
  { _id: false }
);

const BusinessSchema = new Schema<IBusiness>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    subCategory: { type: Schema.Types.ObjectId, ref: "Category" },
    description: { type: String, default: "" },
    address: {
      line1: { type: String, required: true },
      line2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
      pincode: { type: String },
    },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: undefined },
    },
    photos: { type: [String], default: [] },
    workingHours: { type: [WorkingHoursSchema], default: [] },
    contactNumbers: { type: [String], default: [] },
    whatsappEnabled: { type: Boolean, default: false },
    plan: { type: String, enum: ["free", "silver", "premium"], default: "free" },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

BusinessSchema.index({ location: "2dsphere" });
BusinessSchema.index({ name: "text", description: "text" });

export const Business = mongoose.model<IBusiness>("Business", BusinessSchema);
