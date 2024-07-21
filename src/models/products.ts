import { Document, Model, model, Schema } from "mongoose";

export interface IProduct extends Document {
    name: string;
    price: number;
}




const productSchema = new Schema<IProduct>({
    name:{type: String, required: true},
    price:{type:Number, required: true}
});


const Product: Model<IProduct> = model<IProduct>("Product", productSchema);

export default Product;
