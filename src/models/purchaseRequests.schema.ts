import mongoose, { Document, Schema } from "mongoose";

export interface IPurchaseRequest extends Document {
  userId: number;
  userName: string;
  itemName: string;
  createdAt: Date;
}

const PurchaseRequestSchema: Schema = new Schema({
  userId: { type: Number, required: true },
  userName: { type: String, required: true },
  itemName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const PurchaseRequest = mongoose.model<IPurchaseRequest>("PurchaseRequest", PurchaseRequestSchema);
