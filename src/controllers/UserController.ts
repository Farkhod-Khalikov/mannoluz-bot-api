import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import Transaction from "../models/transactions.schema";
import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import i18n from "../utils/i18n";

dotenv.config();

const token = process.env.TOKEN || "";
const bot = new TelegramBot(token);

class UserController {
  static async addBonuses(req: Request, res: Response) {
    try {
      const { phoneNumber, sum, description } = req.body;

      if (!phoneNumber || isNaN(sum)) {
        return res
          .status(400)
          .json({ message: "Invalid phoneNumber or sum provided" });
      }

      // Find user by phoneNumber
      const user = await UserService.findUserByPhoneNumber(phoneNumber);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create a new transaction
      const transaction = await Transaction.create({
        userId: user._id,
        phoneNumber,
        bonuses: sum,
        description: description,
      });
      // Update user's balance
      user.balance = (user.balance || 0) + sum;
      await user.save();
      //Send a message to the User that his balance is updated
      if (user.chatId) {
        await bot.sendMessage(
          user.chatId,
          `Bonuses have been added: ${sum}${i18n.t("coins")}\n${i18n.t("description")}: ${
            transaction.description
          }`
        );
      }
      res.json({ message: "Bonuses added", newBalance: user.balance });
    } catch (error) {
      console.error("Error adding bonuses:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async removeBonuses(req: Request, res: Response) {
    try {
      const { phoneNumber, sum, description } = req.body;

      if (!phoneNumber || isNaN(sum)) {
        return res
          .status(400)
          .json({ message: "Invalid phoneNumber or sum provided" });
      }

      // Find user by phoneNumber
      const user = await UserService.findUserByPhoneNumber(phoneNumber);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if ((user.balance || 0) < sum) {
        return res.status(400).json({ message: "Not enough bonuses" });
      }

      // Create a new transaction
      await Transaction.create({
        userId: user._id,
        phoneNumber: phoneNumber,
        bonuses: -sum,
        description: description // - is just to show removal or additiona (also can add description to show it)
      });

      // Update user's balance
      user.balance = (user.balance || 0) - sum;
      await user.save();
      //Send a message to the User that his balance is updated
      if (user.chatId) {
        await bot.sendMessage(
          user.chatId,
          `Bonuses have been removed: ${sum} coins`
        );
      }
      res.json({ message: "Bonuses removed", newBalance: user.balance });
    } catch (error) {
      console.error("Error removing bonuses:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}

export default UserController;
