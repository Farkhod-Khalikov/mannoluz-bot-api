import Logger from "../utils/logger";
import { Request, Response } from "express";
import UserService from "../services/user.service";
import Transaction from "../models/transactions.schema";
import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import i18n from "../utils/i18n";
import { PurchaseRequest } from "../models/purchaseRequests.schema";
import User from "../models/users.schema";

dotenv.config();
const token = process.env.TOKEN || "";
const bot = new TelegramBot(token);

class UserController {
  // Add bonuses
  static async addBonuses(req: Request, res: Response) {
    Logger.start("addBonuses");
    try {
      const { phonenumber, sum, description, documentId, agentId } = req.body;

      if (!phonenumber || isNaN(sum) || !documentId || !agentId) {
        Logger.error("addBonuses", "Invalid arguments provided");
        Logger.end("addBonuses");

        return res.status(400).json({ message: "Invalid args provided" });
      }

      // Find user by phoneNumber
      const user = await UserService.findUserByPhoneNumber(phonenumber);
      if (!user) {
        Logger.error("addBonuses", "User not found");
        Logger.end("addBonuses");
        return res.status(404).json({ message: "User not found" });
      }

      const transaction = await Transaction.create({
        userId: user.id,
        documentId: documentId,
        agentId: agentId,
        bonuses: sum,
        description: description,
      });
      if (!transaction) {
        console.error("Could not create transaction");
        return res
          .status(409)
          .json({ error: true, message: "Could not create transaction" });
      }
      await transaction.save();

      user.balance += sum;
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

      res.json({
        error: false,
        message: "Bonuses added",
        balance: user.balance,
        agentId: agentId,
      });
    } catch (error) {
      console.error("Error adding bonuses:", error);
      return res
        .status(500)
        .json({ message: "Internal server error. Unknown Error Occured" });
    }
    Logger.end("addBonuses");
  }

  // Remove Bonuses
  static async removeBonuses(req: Request, res: Response) {
    Logger.start("removeBonuses");
    try {
      const { phonenumber, sum, description, documentId, agentId } = req.body;

      if (!phonenumber || isNaN(sum) || !documentId || !agentId) {
        return res
          .status(400)
          .json({ error: true, message: "Invalid args provided" });
      }

      // Find user by phoneNumber
      const user = await UserService.findUserByPhoneNumber(phonenumber);
      if (!user) {
        Logger.error("removeBonuses", "User not found");
        return res.status(404).json({ error: true, message: "User not found" });
      }

      if ((user.balance || 0) < sum) {
        Logger.error(
          "removeBonuses",
          "User has less bonuses than it required to remove"
        );
        return res
          .status(400)
          .json({ error: true, message: "Not enough bonuses" });
      }

      // Create a new transaction add method to user.service
      const transaction = await Transaction.create({
        userId: user.id,
        documentId: documentId,
        agentId: agentId,
        bonuses: -sum,
        description: description,
      });

      if (!transaction) {
        Logger.error("removeBonuses", "Could not create transaction document");
        return res
          .status(500)
          .json({ error: true, message: "Could not create transaction" });
      }
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

      res.json({
        error: false,
        message: "Bonuses removed",
        newBalance,
        agentId,
      });
    } catch (error) {
      console.error("Error removing bonuses:", error);
      res
        .status(500)
        .json({ message: "Internal server error. Unknow error occured" });
    }
    Logger.end("removeBonuses");
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

  //Update isActive Request
  static async updateRequestStatus(req: Request, res: Response) {
    const { phonenumber } = req.body;
    const user = await UserService.findUserByPhoneNumber(phonenumber);
    if (!phonenumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    try {
      await PurchaseRequest.findOneAndUpdate(
        { phonenumber: phonenumber, isActive: true },
        //property to update
        { isActive: false }
      );
      await bot.sendMessage(user.chatId, i18n.t("request_status_update"));
      return res.status(200).json({ message: "The Request status is updated" });
    } catch (error) {
      console.error("Could not update requets status", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async removeTransaction(req: Request, res: Response) {
    const { documentId, agentId } = req.body;

    if (!documentId) {
      return res
        .status(400)
        .json({ error: true, message: "documentId is required" });
    }

    try {
      // Find all transactions with the provided documentId (and agentId if available)
      const query = { documentId: documentId } as any;
      if (agentId) query.agentId = agentId;

      const transactions = await Transaction.find(query);

      if (transactions.length === 0) {
        return res.status(404).json({ message: "No transactions found" });
      }

      // Track user balances that need to be updated
      const userBalances = new Map<string, number>();

      for (const transaction of transactions) {
        // Accumulate the total bonuses adjustment for each user
        if (!userBalances.has(transaction.userId.toString())) {
          userBalances.set(transaction.userId.toString(), 0);
        }

        const currentAdjustment =
          userBalances.get(transaction.userId.toString()) || 0;
        userBalances.set(
          transaction.userId.toString(),
          currentAdjustment + transaction.bonuses
        );
      }

      // Update each user's balance based on accumulated adjustments
      for (const [userId, adjustment] of userBalances.entries()) {
        const user = await User.findById(userId);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        user.balance = (user.balance || 0) - adjustment;
        await user.save();

        // Notify the user
        if (user.chatId) {
          const adjustmentMessage =
            adjustment < 0
              ? `Your balance has been increased by ${Math.abs(
                  adjustment
                )} bonuses due to transaction deletion.`
              : `Your balance has been decreased by ${adjustment} bonuses due to transaction deletion.`;

          await bot.sendMessage(user.chatId, adjustmentMessage);
        }
      }

      // Delete all found transactions
      await Transaction.deleteMany(query);

      return res.status(200).json({
        message: "Transactions deleted and users' balances updated",
      });
    } catch (error) {
      console.error("Could not delete transactions", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}

export default UserController;
