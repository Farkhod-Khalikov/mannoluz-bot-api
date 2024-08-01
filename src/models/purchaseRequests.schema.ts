import mongoose, { Document, Schema } from "mongoose";

export interface IPurchaseRequest extends Document {
  username?: string;
  comment: string; // no need for itemName just comment or description or message
  phonenumber?: number;
  createdAt: Date; // update using timestampts
}

const PurchaseRequestSchema: Schema = new Schema({
  username: { type: String, required: false },
  phonenumber: {type: Number, required: false},
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const PurchaseRequest = mongoose.model<IPurchaseRequest>(
  "PurchaseRequest",
  PurchaseRequestSchema
);
