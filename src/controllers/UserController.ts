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
      const { phoneNumber, sum, description, uniqueId } = req.body;

      if (!phoneNumber || isNaN(sum) || !uniqueId) {
        return res
          .status(400)
          .json({ message: "Invalid phoneNumber, sum, or UniqueID provided" });
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
        uniqueID: uniqueId,
        bonuses: sum,
        description,
      });
      await transaction.save();

      // Update user's balance
      // const uniqueId  =  // Use transaction ID as uniqueId
      const newBalance = (user.balance || 0) + sum;
      user.balance = newBalance;
      await user.save();

      // Send a message to the User that their balance is updated
      if (user.chatId) {
        await bot.sendMessage(
          user.chatId,
          `${i18n.t("bonuses_added_notification")}: ${sum} ${i18n.t(
            "coins"
          )}\n${i18n.t("description")}: ${description}`
        );
      }

      res.json({ message: "Bonuses added", newBalance, uniqueId });
    } catch (error) {
      console.error("Error adding bonuses:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async removeBonuses(req: Request, res: Response) {
    try {
      const { phoneNumber, sum, description, uniqueId } = req.body;
      
      if (!phoneNumber || isNaN(sum) || !uniqueId) {
        return res
          .status(400)
          .json({ message: "Invalid phoneNumber, uniqueId or sum provided" });
      }

      // Find user by phoneNumber
      const user = await UserService.findUserByPhoneNumber(phoneNumber);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if ((user.balance || 0) < sum) {
        return res.status(400).json({ message: "Not enough bonuses" });
      }

      // Create a new transaction add method to user.service
      const transaction = await Transaction.create({
        userId: user._id,
        phoneNumber,
        uniqueID: uniqueId,
        bonuses: -sum,
        description,
      });
      await transaction.save();

      // Update user's balance
      const newBalance = (user.balance || 0) - sum;
      user.balance = newBalance;
      await user.save();

      // Send a message to the User that their balance is updated
      if (user.chatId) {
        await bot.sendMessage(
          user.chatId,
          `${i18n.t("bonuses_removed_notification")}: ${sum} ${i18n.t(
            "coins"
          )}\n${i18n.t("description")}: ${description}`
        );
      }

      res.json({ message: "Bonuses removed", newBalance });
    } catch (error) {
      console.error("Error removing bonuses:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}

export default UserController;
