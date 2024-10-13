import { Model, model, Schema } from 'mongoose';
import { ITransaction } from './bonuses-transactions.schema';

const moneyTransactionsSchema = new Schema<ITransaction>(
  {
    documentId: { type: String, required: true },
    agentId: { type: String, required: true },
    userId: { type: String, required: true },
    sum: { type: Number, required: true },
    description: { type: String, required: false },
    transactionType: { type: String, required: false, default: 'money' },
    oldBalance: { type: Number, required: true },
    newBalance: { type: Number, required: true },
  },
  { timestamps: true }
);

const MoneyTransaction: Model<ITransaction> = model<ITransaction>(
  'MoneyTransaction',
  moneyTransactionsSchema
);

export default MoneyTransaction;
