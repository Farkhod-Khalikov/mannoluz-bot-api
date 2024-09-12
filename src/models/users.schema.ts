import { Document, Model, model, Schema } from 'mongoose';

// Define a TypeScript interface for the User document
export interface IUser extends Document {
  chatId: number;
  name: string;
  phone: string;
  language: string;
  balance?: number;
  isAdmin?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the schema for the User model
const userSchema = new Schema<IUser>(
  {
    chatId: { type: Number, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    language: { type: String, required: true },
    balance: { type: Number, default: 0 },
    isAdmin: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Create the User model
const User: Model<IUser> = model<IUser>('User', userSchema);

export default User;
