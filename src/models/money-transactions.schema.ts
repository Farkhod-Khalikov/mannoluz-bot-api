import { Document, Model, model, Schema } from 'mongoose';
import { ITransaction } from './bonuses-transactions.schema';

const moneyTransactionsSchema = new Schema<ITransaction>(
  {
    documentId: { type: String, required: true },
    agentId: { type: String, required: true },
    userId: { type: String, required: true },
    sum: { type: Number, required: true },
    description: { type: String, required: false },
    transactionType: {type: String, required: false, default: "money"}
  },
  { timestamps: true }
);

const MoneyTransaction: Model<ITransaction> = model<ITransaction>(
  'Transaction',
  moneyTransactionsSchema
);

export default MoneyTransaction;
