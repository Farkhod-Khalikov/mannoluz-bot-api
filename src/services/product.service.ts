import { ProgramUpdateLevel } from "typescript";
import Product, { IProduct } from "../models/products.schema";
import { PurchaseRequest } from "../models/purchaseRequests.schema";
import Transaction from "../models/transactions.schema";
import User, { IUser } from "../models/users.schema";

export default class ProductService {

  // findProductByUniqueID: string
  public static async findProductByUniqued(uniqueID: string): Promise<IProduct | null> {
    return User.findOne({ uniqueID });
  }

  //createProduct
  public static async createProduct(
    uniqueID: string,
    name: string,
    price: number,
    amount: number,
  ) {
    const product = new Product({
      uniqueID,
      name,
      price,
      amount,
    });
    await product.save();
  }

  public static async updateProductByUniqueID(uniqueID: string, amount?: number, price?: number){
    // update record regarding to amount or price
  }

  // Get all products
  public static async getAllProducts(): Promise<IProduct[]> {
    return Product.find({});
  }
}