import { Request, Response } from "express";
import UserService from "../services/user.service";
import Product from "../models/products.schema";
import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import i18n from "../utils/i18n";
import ProductService from "../services/product.service";

dotenv.config();

export default class ProductController {
  // perform this logic and devide everything related to products into products service
  static async addProduct(req: Request, res: Response) {
    try {
      const { uniqueId, name, price, amount } = req.body;
      if (!name || !price || !uniqueId) {
        res
          .status(400)
          .json({ message: "Invalid name, price, or uniqueId provided" });
      }
      // await ProductService.createProduct(uniqueId, name, price, amount);
      const product  = await Product.create({
        uniqueId: uniqueId,
        name: name,
        price: price,
        ammount: amount
      });
      await product.save();
      return res.status(200).json({ message: "Product is added to db" });
    } catch (error) {
      return res.status(404).json({message:"Could not create product in db"});
    }
  }
  static async updateProduct(req: Request, res: Response) {}
  static async removeProduct(req: Request, res: Response) {}
}
