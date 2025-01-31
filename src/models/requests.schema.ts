import mongoose, { Document, Schema } from "mongoose";

export interface IPurchaseRequest extends Document {
  username: string;
  phoneNumber: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

const PurchaseRequestSchema: Schema = new Schema(
  {
    username: { type: String, required: true },
    phoneNumber: { type: Number, required: true },
    comment: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);

export const PurchaseRequest = mongoose.model<IPurchaseRequest>(
  "PurchaseRequest",
  PurchaseRequestSchema,
);
