import { Document, Model, model, Schema } from "mongoose";

export interface IProduct extends Document {
  uniqueId: string;
  name: string;
  price: number;
  amount: number;
}

const productSchema = new Schema<IProduct>({
  uniqueId: {type: String, required: true, unique: true},
  name: { type: String, required: true },
  price: { type: Number, required: true },
  amount: {type: Number, required: true, default:0}
});
const Product: Model<IProduct> = model<IProduct>("Product", productSchema);

export default Product;
