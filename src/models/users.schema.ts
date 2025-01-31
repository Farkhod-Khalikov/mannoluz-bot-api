import { Document, Model, model, Schema } from "mongoose";

export interface IUser extends Document {
  chatId: number;
  name: string;
  phone: string;
  language: string;
  bonuses: number;
  money: number;
  isAdmin?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  isSudo?: boolean;
}

const userSchema = new Schema<IUser>(
  {
    chatId: { type: Number, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    language: { type: String, required: true },
    bonuses: { type: Number, default: 0 },
    money: { type: Number, default: 0 },
    isAdmin: { type: Boolean, default: false },
    isSudo: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

const User: Model<IUser> = model<IUser>("User", userSchema);

export default User;
