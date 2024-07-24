//./models/transactions.ts
import { Document, Model, model, Schema } from "mongoose";

export interface ITransaction extends Document {
    userId: string;
    bonuses: number;
    createdAt?: Date;
}

const transactionSchema = new Schema<ITransaction>({
    userId: { type: String, required: true},
    bonuses: {type: Number, required: true },
    createdAt: {type: Date, default: Date.now}
})

const Transaction: Model<ITransaction> = model <ITransaction>("Transaction", transactionSchema);

export default Transaction;