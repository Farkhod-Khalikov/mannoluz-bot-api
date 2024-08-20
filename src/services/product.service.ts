import Product, { IProduct } from "../models/products.schema";

export default class ProductService {
  // findProductByUniqueID: string
  public static async findProductByUniqueId(
    uniqueID: string
  ): Promise<IProduct | null> {
    return Product.findOne({ uniqueID });
  }
  static async addOrUpdateProduct(
    uniqueId: string,
    name?: string,
    price?: number,
    date?: string
  ) {
    try {
      // Check if the product already exists
      const existingProduct = await Product.findOne({ uniqueId });

      if (existingProduct) {
        // If the product exists, update it
        if (name) existingProduct.name = name;
        if (price) existingProduct.price = price;
        existingProduct.date = date || "";
        await existingProduct.save();
        return { isNewProduct: false, existingProduct };
      } else {
        // If the product doesn't exist, create a new one
        const newProduct = await new Product({
          uniqueId,
          name,
          price,
          date,
        }).save();
        return { isNewProduct: true, newProduct };
      }
    } catch (error) {
      console.error("Error in addOrUpdateProduct:", error);
      throw new Error("Error in addOrUpdateProduct");
    }
  }

  static async deleteProduct(uniqueId: string) {
    try {
      const result = await Product.findOneAndDelete({ uniqueId });
      return !!result;
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
