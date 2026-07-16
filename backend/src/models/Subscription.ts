import mongoose, { Schema, Document, Types } from "mongoose";

export type SubscriptionStatus = "active" | "expired" | "cancelled" | "pending";

export interface ISubscription extends Document {
  _id: Types.ObjectId;
  businessId: Types.ObjectId;
  plan: "free" | "silver" | "premium";
  startDate: Date;
  endDate?: Date;
  status: SubscriptionStatus;
  // stub payment integration fields — swap for real Razorpay/Stripe later
  paymentProvider?: "razorpay" | "stripe" | "mock";
  paymentReference?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    plan: { type: String, enum: ["free", "silver", "premium"], required: true },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled", "pending"],
      default: "pending",
    },
    paymentProvider: { type: String, enum: ["razorpay", "stripe", "mock"], default: "mock" },
    paymentReference: { type: String },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model<ISubscription>("Subscription", SubscriptionSchema);
