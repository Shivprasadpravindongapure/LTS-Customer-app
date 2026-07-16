import mongoose, { Schema, Document, Types } from "mongoose";

export interface IReview extends Document {
  _id: Types.ObjectId;
  businessId: Types.ObjectId;
  customerName: string;
  rating: number;
  comment: string;
  ownerReply?: string;
  ownerRepliedAt?: Date;
  flagged: boolean;
  flagReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    customerName: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: "" },
    ownerReply: { type: String },
    ownerRepliedAt: { type: Date },
    flagged: { type: Boolean, default: false, index: true },
    flagReason: { type: String },
  },
  { timestamps: true }
);

export const Review = mongoose.model<IReview>("Review", ReviewSchema);
