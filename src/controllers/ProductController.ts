import { Request, Response } from "express";
import ProductService from "../services/product.service";
import Logger from "../utils/logger";
import TelegramBot from "node-telegram-bot-api";

export default class ProductController {
  private bot: TelegramBot;
  constructor(bot: TelegramBot) {
    this.bot = bot;
  }
  // Add Product or Update  Product by documentId and agentId
  async addProduct(req: Request, res: Response) {
    Logger.start("addProduct", "Adding product...");

    try {
      // json body arguments
      const { documentId, agentId, name, price, date } = req.body;

      // Check the arguments
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

      // If product is New
      if (product?.isNewProduct) {
        Logger.end("addProduct");
        return res.status(200).json({
          error: false,
          message: "Product added successfully",
          product: product,
        });
      }

      Logger.end("addProduct");
      return res.status(200).json({
        error: false,
        message: "Product updated successfully",
        product: product,
      });
    } catch (error) {
      if (error instanceof Error) {
        Logger.error("addProduct", error.message);
        return res.json({ error: true, message: error.message });
      }

      Logger.error("addProduct", "Unknown Error");
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  //Remove product/products
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
      // if not agentId provided delete entire document
      if (!agentId) {
        const deletedProducts = await ProductService.deleteProduct(documentId);
        Logger.end("removeProduct", "Product removed successfully");
        return res.status(200).json({
          error: false,
          message: "Products removed successfully",
          deletedCount: deletedProducts,
        });
        // if (deletedProducts === 0) {
        //   Logger.error("removeProduct", "Products NOT Found");
        //   return res
        //     .status(404)
        //     .json({ error: true, message: "Products NOT Found" });
        // } else {
        //   Logger.end("removeProduct", "Product removed successfully");
        //   return res.status(200).json({
        //     error: false,
        //     message: "Product removed successfully",
        //     deletedCount: deletedProducts,
        //   });}
      }
      // delete single product when agentId is provided
      const deletedProduct = await ProductService.deleteProduct(
        documentId,
        agentId
      );

      // Check whether last catch block actually returns message writtine in throw new Error
      // if (!deletedProduct) {
      //   return res
      //     .status(404)
      //     .json({ error: true, message: "Product Not Found" });
      // }

      return res.status(200).json({
        error: false,
        message: "Product deleted successfully",
        deletedProduct: deletedProduct,
      });
    } catch (error) {
      // catch any error thrown by service
      if (error instanceof Error) {
        Logger.error("removeProduct", error.message);
        return res.json({ error: true, message: error.message });
      }

      Logger.error("removeProduct", "Unknown Error Appeared");
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
