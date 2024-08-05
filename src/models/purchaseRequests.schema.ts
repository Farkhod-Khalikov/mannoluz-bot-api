import mongoose, { Document, Schema } from "mongoose";

export interface IPurchaseRequest extends Document {
  username: string;
  phonenumber: number;
  comment: string; 
  createdAt: Date; // update using timestampts P.S: updatedAt required if you are goint to update isActive
  isActive: boolean;
}

const PurchaseRequestSchema: Schema = new Schema({
  username: { type: String, required: true },
  phonenumber: {type: Number, required: true},
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isActive: {type: Boolean, default: true},
});

export const PurchaseRequest = mongoose.model<IPurchaseRequest>(
  "PurchaseRequest",
  PurchaseRequestSchema
);
