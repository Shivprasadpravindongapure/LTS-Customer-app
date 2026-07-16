import mongoose, { Schema, Document, Types } from "mongoose";

export type EnquiryStatus = "new" | "contacted" | "converted" | "closed";

export interface IEnquiry extends Document {
  _id: Types.ObjectId;
  businessId: Types.ObjectId;
  customerName: string;
  customerMobile: string;
  message: string;
  status: EnquiryStatus;
  createdAt: Date;
  updatedAt: Date;
}

const EnquirySchema = new Schema<IEnquiry>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    customerName: { type: String, required: true },
    customerMobile: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["new", "contacted", "converted", "closed"],
      default: "new",
      index: true,
    },
  },
  { timestamps: true }
);

export const Enquiry = mongoose.model<IEnquiry>("Enquiry", EnquirySchema);
