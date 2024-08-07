import { Request, Response } from "express";
import  UserService  from "../services/user.service";
import Product from "../models/products.schema";
import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import i18n from "../utils/i18n";

dotenv.config();

export default class ProductController {
  // perform this logic and devide everything related to products into products service
  static async addProduct(req: Request, res: Response) {}
  static async updateProduct(req: Request, res: Response){

  }
  static async removeProduct(req: Request, res: Response) {}
}
