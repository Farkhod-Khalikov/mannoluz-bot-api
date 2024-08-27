import Product, { IProduct } from "../models/products.schema";
import Logger from "../utils/logger";

export default class ProductService {
  // findProductByUniqueID: string
  public static async findProductByUniqueId(
    uniqueID: string
  ): Promise<IProduct | null> {
    return Product.findOne({ uniqueID });
  }
  // static async addProduct(documentId: string ,agentId: string, name: string, price: number, date:string){

  // }
  static async addOrUpdateProduct(
    documentId: string,
    agentId: string,
    name?: string,
    price?: number,
    date?: string
  ) {
    try {
      // Check if the product already exists
      const existingProduct = await Product.findOne({ documentId, agentId });

      // update the existing product
      if (existingProduct) {
        // If the product exists, update it
        if (name) existingProduct.name = name;
        if (price) existingProduct.price = price;
        if (date) existingProduct.date = date;
        await existingProduct.save();
        return { isNewProduct: false, existingProduct };
        // !existing product means to create one (logic man...)
      } // If the product doesn't exist, create a new one

      const newProduct = await new Product({
        documentId,
        agentId,
        name,
        price,
        date,
      }).save();

      if (!newProduct) {
        Logger.error("addOrUpdateProduct", "Could not Create Product Document");
        throw new Error("Could not create new product document");
      }

      return { isNewProduct: true, newProduct };

      // Catch any unhandled error
    } catch (error) {
      if (error instanceof Error) {
        Logger.error("addOrUpdateProduct", error.message);
        throw new Error(error.message);
      }
    }
  }

  static async deleteProduct(documentId: string, agentId?: string) {
    try {
      //NOTE: firs check if agentId and do something else
      // Deleting document when no agentId provided
      if (agentId) {
        const deletedProduct = await Product.findOneAndDelete({
          documentId,
          agentId,
        });

        if (!deletedProduct) {
          throw new Error("Product Not Found.");
        }
        return deletedProduct;
      }

      //Find and delete all products with documentId == documentId
      const products = await Product.deleteMany({ documentId });

      // if no products found return error
      if (products.deletedCount === 0) {
        throw new Error("Products with specified document ID NOT found");
      }

      // when products are deleted return counter
      return products.deletedCount;
      // Catch any unhandled error
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error in removeProduct:", error);
        throw new Error(error.message);
      }
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
