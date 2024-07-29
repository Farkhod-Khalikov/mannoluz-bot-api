//./models/transactions.ts
import { Document, Model, model, Schema } from "mongoose";

export interface ITransaction extends Document {
  userId: string;
  bonuses: number;
  createdAt?: Date;
  updatedAt?: Date;
  // operation: string; //adding or removing
  description?: string;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: { type: String, required: true },
    bonuses: { type: Number, required: true },
    // operation: { type: String, required: true },
    description: { type: String, required: false },
  },
  { timestamps: true }
);

const Transaction: Model<ITransaction> = model<ITransaction>(
  "Transaction",
  transactionSchema
);

export default Transaction;
