import { Request, Response } from "express";
import UserService from "../services/user.service";
import Transaction from "../models/transactions.schema";
import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import i18n from "../utils/i18n";

dotenv.config();

const token = process.env.TOKEN || "";
const bot = new TelegramBot(token);

class UserController {

  // Add bonuses
  static async addBonuses(req: Request, res: Response) {
    try {
      const { phonenumber, sum, description, uniqueId } = req.body;

      if (!phonenumber || isNaN(sum) || !uniqueId) {
        return res
          .status(400)
          .json({ message: "Invalid phonenumber, sum, or UniqueID provided" });
      }

      // Find user by phoneNumber
      const user = await UserService.findUserByPhoneNumber(phonenumber);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create a new transaction
      const transaction = await Transaction.create({
        userId: user._id,
        phonenumber,
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
          `${i18n.t("bonuses_addition")}: ${sum} ${i18n.t("coins")}\n${i18n.t(
            "description"
          )}: ${description}`
        );
      }

      res.json({ message: "Bonuses added", newBalance, uniqueId });
    } catch (error) {
      console.error("Error adding bonuses:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // Remove Bonuses 
  static async removeBonuses(req: Request, res: Response) {
    try {
      const { phonenumber, sum, description, uniqueId } = req.body;

      if (!phonenumber || isNaN(sum) || !uniqueId) {
        return res
          .status(400)
          .json({ message: "Invalid phoneNumber, uniqueId or sum provided" });
      }

      // Find user by phoneNumber
      const user = await UserService.findUserByPhoneNumber(phonenumber);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if ((user.balance || 0) < sum) {
        return res.status(400).json({ message: "Not enough bonuses" });
      }

      // Create a new transaction add method to user.service
      const transaction = await Transaction.create({
        userId: user._id,
        phonenumber,
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
          `${i18n.t("bonuses_removal")}: ${sum} ${i18n.t("coins")}\n${i18n.t(
            "description"
          )}: ${description}`
        );
      }

      res.json({ message: "Bonuses removed", newBalance });
    } catch (error) {
      console.error("Error removing bonuses:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // Remove Admin
  static async removeAdmin(req: Request, res: Response) {
    try {
      const { phonenumber } = req.body;
      if (!phonenumber) {
        return res.status(400).json({ message: "Phone is required" });
      }
      const user = await UserService.findUserByPhoneNumber(phonenumber);
      if (!user) {
        return res.status(404).json({ message: "user not found" });
      } else {
        await UserService.updateUserAdminStatus(phonenumber, false);
        res.json({ message: "User admin has been removed" });
        await bot.sendMessage(
          user.chatId,
          i18n.t("admin_removed_notification")
        );
      }
    } catch (error) {
      console.error("Error removing admin privileges.", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
  //Update isActive Request
  static async updateRequestStatus(req: Request, res: Response) {

  }

  // Add Admin
  static async addAdmin(req: Request, res: Response) {
    try {
      const { phonenumber } = req.body;
      if (!phonenumber) {
        return res.status(400).json({ message: "Phone number is required" });
      }
      const user = await UserService.findUserByPhoneNumber(phonenumber);
      if (!user) {
        res.status(404).json({ message: "user not found" });
      } else {
        await UserService.updateUserAdminStatus(phonenumber, true);
        res.json({ message: "User granted admin privileges" });
        await bot.sendMessage(
          user.chatId,
          i18n.t("admin_granted_notification")
        );
      }
    } catch (error) {
      console.error("Error granting admin privileges", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}

export default UserController;
