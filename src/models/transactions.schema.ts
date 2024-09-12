//./models/transactions.ts
import { Document, Model, model, Schema } from 'mongoose';

export interface ITransaction extends Document {
  documentId: string;
  agentId: string;
  userId: string;
  bonuses: number;
  createdAt?: Date;
  updatedAt?: Date;
  description?: string;
}

const transactionSchema = new Schema<ITransaction>(
  {
    documentId: { type: String, required: true },
    agentId: { type: String, required: true },
    userId: { type: String, required: true },
    bonuses: { type: Number, required: true },
    description: { type: String, required: false },
  },
  { timestamps: true }
);

const Transaction: Model<ITransaction> = model<ITransaction>('Transaction', transactionSchema);

export default Transaction;
