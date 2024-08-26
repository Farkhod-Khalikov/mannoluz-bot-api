import { Request, Response } from "express";
import ProductService from "../services/product.service";
import Logger from "../utils/logger";
import TelegramBot from "node-telegram-bot-api";

export default class ProductController {
  private bot: TelegramBot;
  constructor(bot: TelegramBot) {
    this.bot = bot;
  }
  async addProduct(req: Request, res: Response) {
    Logger.start("addProduct", "Adding product...");
    try {
      const { uniqueId, name, price, date } = req.body;

      if (!uniqueId || (!name && !price)) {
        Logger.error(
          "addProduct",
          "Could not add product due to invalid req.body arguments"
        );
        return res.status(400).json({
          error: true,
          message: "Invalid args. uniqueId, name and price are required.",
        });
      }

      // Call the ProductService to add or update the product
      const result = await ProductService.addOrUpdateProduct(
        uniqueId,
        name,
        price,
        date
      );

      if (result.isNewProduct) {
        Logger.end("addProduct");
        return res.status(200).json({
          error: false,
          message: "Product added successfully",
          result,
        });
      } else {
        Logger.end("addProduct");
        return res.status(200).json({
          error: false,
          message: "Product updated successfully",
          result,
        });
      }
    } catch (error) {
      Logger.error("addProduct", "Unknown Error");
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async removeProduct(req: Request, res: Response) {
    Logger.start("removeProduct");
    try {
      const { uniqueId } = req.body;

      if (!uniqueId) {
        Logger.error("removeProduct", "uniqueId is not provided in req.body");
        return res
          .status(400)
          .json({ error: true, message: "Invalid uniqueId provided" });
      }

      const result = await ProductService.deleteProduct(uniqueId);

      if (!result) {
        Logger.error("removeProduct", "Product NOT Found");
        res.status(404).json({ error: true, message: "Product NOT Found" });
      } else {
        Logger.end("removeProduct", "Product removed successfully");
        return res
          .status(200)
          .json({ error: false, message: "Product removed successfully" });
      }
    } catch (error) {
      Logger.error("removeProduct", "Unknown Error Appeared");
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
