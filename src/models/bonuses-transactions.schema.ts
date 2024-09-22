//./models/transactions.ts
import { Document, Model, model, Schema } from 'mongoose';

export interface ITransaction extends Document {
  documentId: string;
  agentId: string;
  userId: string;
  sum: number;
  createdAt?: Date;
  updatedAt?: Date;
  description?: string;
  transactionType?: string;
}

const bonusesTransactionsSchema = new Schema<ITransaction>(
  {
    documentId: { type: String, required: true },
    agentId: { type: String, required: true },
    userId: { type: String, required: true },
    sum: { type: Number, required: true },
    description: { type: String, required: false },
    transactionType: {type: String, required:false, default: "bonuses"},
  },
  { timestamps: true }
);

const BonusesTransaction: Model<ITransaction> = model<ITransaction>('BonusesTransaction', bonusesTransactionsSchema);

export default BonusesTransaction;
