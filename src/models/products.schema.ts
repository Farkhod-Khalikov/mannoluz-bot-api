import { Document, Model, model, Schema } from "mongoose";

export interface IProduct extends Document {
  uniqueId: string;
  name: string;
  price: number;
  date: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const productSchema = new Schema<IProduct>(
  {
    uniqueId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    date: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);
const Product: Model<IProduct> = model<IProduct>("Product", productSchema);

export default Product;
