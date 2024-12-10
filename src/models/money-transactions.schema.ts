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
    date: {type: String, required: false},
    oldBalance: { type: Number, required: true, default: 0},
    newBalance: { type: Number, required: true, default: 0},
  },
  { timestamps: true }
);

const MoneyTransaction: Model<ITransaction> = model<ITransaction>(
  'MoneyTransaction',
  moneyTransactionsSchema
);

export default MoneyTransaction;
