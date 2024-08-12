import { ProgramUpdateLevel } from "typescript";
import Product, { IProduct } from "../models/products.schema";
import { PurchaseRequest } from "../models/purchaseRequests.schema";
import Transaction from "../models/transactions.schema";
import User, { IUser } from "../models/users.schema";

export default class ProductService {
  // findProductByUniqueID: string
  public static async findProductByUniqued(
    uniqueID: string
  ): Promise<IProduct | null> {
    return User.findOne({ uniqueID });
  }
  static async addOrUpdateProduct(
    uniqueId: string,
    name: string,
    price: number
  ) {
    try {
      // Check if the product already exists
      const existingProduct = await Product.findOne({ uniqueId });

      if (existingProduct) {
        // If the product exists, update it
        existingProduct.name = name;
        existingProduct.price = price;
        await existingProduct.save();
        return { updated: true };
      } else {
        // If the product doesn't exist, create a new one
        const newProduct = new Product({ uniqueId, name, price });
        await newProduct.save();
        return { updated: false };
      }
    } catch (error) {
      console.error("Error in addOrUpdateProduct:", error);
      throw new Error("Error in addOrUpdateProduct");
    }
  }

  static async removeProduct(uniqueId: string) {
    try {
      const result = await Product.findOneAndDelete({ uniqueId });
      return result ? true : false;
    } catch (error) {
      console.error("Error in removeProduct:", error);
      throw new Error("Error in removeProduct");
    }
  }
  //createProduct
  public static async createProduct(
    uniqueID: string,
    name: string,
    price: number,
    amount: number
  ) {
    const product = new Product({
      uniqueID,
      name,
      price,
      amount,
    });
    await product.save();
  }

  public static async updateProductByUniqueID(
    uniqueID: string,
    amount?: number,
    price?: number
  ) {
    // update record regarding to amount or price
  }

  // Get all products
  public static async getAllProducts(): Promise<IProduct[]> {
    return Product.find({});
  }
}
