import { Request, Response } from "express";
import ProductService from "../services/product.service";
import Logger from "../utils/logger";
import TelegramBot from "node-telegram-bot-api";
import { error } from "console";

export default class ProductController {
  private bot: TelegramBot;
  constructor(bot: TelegramBot) {
    this.bot = bot;
  }

  async addProduct(req: Request, res: Response) {
    Logger.start("addProduct", "Adding product...");
    try {
      const { documentId, agentId, name, price, date } = req.body;

      if (!documentId || !agentId || (!name && !price)) {
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
      const product = await ProductService.addOrUpdateProduct(
        documentId,
        agentId,
        name,
        price,
        date
      );

      if (product.isNewProduct) {
        Logger.end("addProduct");
        return res.status(200).json({
          error: false,
          message: "Product added successfully",
          product: product,
        });
      } else {
        Logger.end("addProduct");
        return res.status(200).json({
          error: false,
          message: "Product updated successfully",
          product: product,
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
      const { documentId, agentId } = req.body;

      if (!documentId || (!documentId && !agentId)) {
        Logger.error("removeProduct", "documentId is not provided in req.body");
        return res
          .status(400)
          .json({ error: true, message: "Invalid documentId provided" });
      }
      if (!agentId) {
        const deletedProducts = await ProductService.deleteProduct(documentId);

        if (deletedProducts.error == true) {
          Logger.error("removeProduct", "Products NOT Found");
          return res
            .status(404)
            .json({ error: true, message: "Products NOT Found" });
        } else {
          Logger.end("removeProduct", "Product removed successfully");
          return res.status(200).json({
            error: false,
            message: "Product removed successfully",
            deletedCount: deletedProducts.deletedCount,
          });
        }
      } else {
        const deletedProduct = await ProductService.deleteProduct(
          documentId,
          agentId
        );
        if (!deletedProduct) {
          return res
            .status(404)
            .json({ error: true, message: "Product Not Found" });
        }
        return res.status(200).json({
          error: deletedProduct.error,
          message: deletedProduct.message,
        });
      }
    } catch (error) {
      Logger.error("removeProduct", "Unknown Error Appeared");
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
