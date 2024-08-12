import { Request, Response } from "express";
import ProductService from "../services/product.service";

export default class ProductController {
  static async addProduct(req: Request, res: Response) {
    try {
      const { uniqueId, name, price } = req.body;

      if (!uniqueId || !name || !price) {
        return res.status(400).json({ message: "Invalid uniqueId, name, or price provided" });
      }

      // Call the ProductService to add or update the product
      const result = await ProductService.addOrUpdateProduct(uniqueId, name, price);

      if (result.updated) {
        return res.status(200).json({ message: "Product updated successfully" });
      } else {
        return res.status(200).json({ message: "Product added successfully" });
      }
    } catch (error) {
      console.error("Error in addProduct:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  static async removeProduct(req: Request, res: Response) {
    try {
      const { uniqueId } = req.body;

      if (!uniqueId) {
        return res.status(400).json({ message: "Invalid uniqueId provided" });
      }

      const result = await ProductService.removeProduct(uniqueId);

      if (result) {
        return res.status(200).json({ message: "Product removed successfully" });
      } else {
        return res.status(404).json({ message: "Product not found" });
      }
    } catch (error) {
      console.error("Error in removeProduct:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}