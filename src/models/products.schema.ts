import { Document, Model, model, Schema } from "mongoose";

export interface IProduct extends Document {
  documentId: string;
  agentId: string;
  name: string;
  price: number;
  date: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const productSchema = new Schema<IProduct>(
  {
    documentId: { type: String, required: true },
    agentId: { type: String, required: true },
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
