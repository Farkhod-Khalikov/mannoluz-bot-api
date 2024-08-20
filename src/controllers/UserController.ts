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

        return res
          .status(400)
          .json({ error: true, message: "Invalid args provided" });
      }

      // Find user by phoneNumber
      const user = await UserService.findUserByPhoneNumber(phonenumber);

      if (!user) {
        Logger.error("addBonuses", "User not found");
        return res.status(404).json({ error: true, message: "User not found" });
      }

      const transaction = await Transaction.create({
        userId: user.id,
        documentId: documentId,
        agentId: agentId,
        bonuses: sum,
        description: description,
      });

      if (!transaction) {
        Logger.error("addBonuses", "Could not create transaction");
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
      Logger.end("addBonuses", "Bonuses are added");
      return res.status(200).json({
        error: false,
        message: "Bonuses added",
        balance: user.balance,
        agentId: agentId,
      });
    } catch (error) {
      Logger.error(
        "addBonuses",
        "Could not add bonuses due to unhanlded error"
      );
      if (error instanceof Error) {
        return res.status(500).json({ error: true, message: error.message });
      } else {
        return res.status(500).json({
          error: true,
          message: "Internal Server Error. Error is unkown",
        });
      }
    }
  }

  // Remove Bonuses
  static async removeBonuses(req: Request, res: Response) {
    Logger.start("removeBonuses");
    try {
      const { phonenumber, sum, description, documentId, agentId } = req.body;

      if (!phonenumber || isNaN(sum) || !documentId || !agentId) {
        return res.status(400).json({
          error: true,
          message:
            "Invalid args provided. phonenumber, sum, documentId, and agentId are required.",
        });
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
          "User has less bonuses than it is required to remove"
        );
        return res.status(400).json({
          error: true,
          message: "Not enough bonuses",
          currentBalance: user.balance,
        });
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

      // Update user balance
      if (user.balance && user.balance > 0) {
        user.balance -= sum;
        await user.save();
      }

      // Send a message to the User that their balance is updated
      if (user.chatId) {
        await bot.sendMessage(
          user.chatId,
          `${i18n.t("bonuses_removal")}: ${sum} ${i18n.t("coins")}\n${i18n.t(
            "description"
          )}: ${description}`
        );
      }

      Logger.end("removeBonuses");
      const newBalance = user.balance;
      return res.status(200).json({
        error: false,
        message: "Bonuses removed",
        newBalance,
        agentId,
      });
    } catch (error) {
      Logger.error(
        "removeBonuses",
        "Unhandled Error occured while removing bonuses"
      );
      if (error instanceof Error) {
        res.status(500).json({
          error: true,
          message: error.message,
        });
      } else {
        res.status(500).json({
          error: true,
          message: "Internal server error. Unknow error occured",
        });
      }
    }
  }

  // Remove Admin
  static async removeAdmin(req: Request, res: Response) {
    Logger.start("removeAdmin");
    try {
      const { phonenumber } = req.body;
      if (!phonenumber) {
        Logger.error("removeAdmin", "Phone is required");
        return res
          .status(400)
          .json({ error: true, message: "Phone is required" });
      }

      const user = await UserService.findUserByPhoneNumber(phonenumber);

      if (!user) {
        Logger.error("removeAdmin", "User not found");
        return res.status(404).json({ error: true, message: "user not found" });
      }

      const username = user.name;
      const isAdmin = user.isAdmin;

      if (!user.isAdmin) {
        Logger.warn(
          "removeAdmin",
          "Tried to remove admin privileges from user who is not an admin"
        );
        Logger.end("removeAdmin");
        res.status(200).json({
          error: false,
          message: "Status is not updated since user is not an admin",
          username,
          isAdmin,
        });
      } else {
        await UserService.updateUserAdminStatus(phonenumber, false);
        await bot.sendMessage(
          user.chatId,
          i18n.t("admin_removed_notification")
        );
        Logger.end("removeAdmin");
        return res.status(200).json({
          error: false,
          message: "User admin has been removed",
          username,
          isAdmin,
        });
      }
    } catch (error) {
      Logger.error("removeAdmin", "Error occured while removing admin");
      console.error("ERROR: \n", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // Add Admin
  static async addAdmin(req: Request, res: Response) {
    Logger.start("addAdmin");
    try {
      const { phonenumber } = req.body;
      if (!phonenumber) {
        Logger.error("addAdmin", "Phone number is required");
        return res
          .status(400)
          .json({ error: true, message: "Phone number is required" });
      }
      const user = await UserService.findUserByPhoneNumber(phonenumber);

      if (!user) {
        Logger.error("addAdmin", "User not found");
        return res.status(404).json({ message: "user not found" });
      }
      const username = user.name;
      const isAdmin = user.isAdmin;

      if (isAdmin) {
        Logger.warn(
          "addAdmin",
          "Tried to add admin privileges to the user who is already admin"
        );
        Logger.end("addAdmin");
        return res.status(200).json({
          error: false,
          message: "User is already an admin",
          username,
          isAdmin,
        });
      } else {
        await UserService.updateUserAdminStatus(phonenumber, true);
        Logger.end("addAdmin");
        res.json({
          error: false,
          message: "User granted admin privileges",
          username,
          isAdmin,
        });
        await bot.sendMessage(
          user.chatId,
          i18n.t("admin_granted_notification")
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        Logger.error("addAdmin", "Could not admin status for the user");
        res.status(500).json({ error: true, message: error.message });
      } else {
        Logger.error(
          "addAdmin",
          "Unknown Error occured while updating user isAdmin status"
        );
        return res
          .status(500)
          .json({ error: true, message: "Internal Server Error" });
      }
    }
  }

  //Update isActive Request
  static async updateRequestStatus(req: Request, res: Response) {
    Logger.start("updateRequestStatus");
    try {
      const { phonenumber } = req.body;
      const user = await UserService.findUserByPhoneNumber(phonenumber);
      if (!phonenumber) {
        Logger.error(
          "updateRequestStatus",
          "phonenumbe is required to update request status"
        );
        return res
          .status(400)
          .json({ error: true, message: "Phone number is required" });
      }
      if (!user) {
        Logger.error("updateRequestStatus", "User not found");
        return res.status(400).json({ error: true, message: "User not found" });
      }
      const purchaseRequest = await PurchaseRequest.findOneAndUpdate(
        { phonenumber: phonenumber, isActive: true },
        //property to update
        { isActive: false }
      );
      if (!purchaseRequest) {
        Logger.error("updateRequestStatus", "Purchase Request is not found");
        return res
          .status(404)
          .json({ error: true, message: "Purchase request is not found" });
      }
      const username = purchaseRequest.username;
      const isActive = purchaseRequest.isActive;
      if (!isActive) {
        Logger.warn(
          "updateRequestStatus",
          "Tried to update purchase request status that is already NOT active"
        );
        return res.status(200).json({
          error: false,
          message:
            "Tried to update purchase request status that is already NOT active",
          username,
          isActive,
        });
      }
      await bot.sendMessage(user.chatId, i18n.t("request_status_update"));
      Logger.end("updatePurchaseRequeset");
      return res.status(200).json({
        error: false,
        message: "The Request status is updated",
        username,
        isActive,
      });
    } catch (error) {
      if (error instanceof Error) {
        const msg = error.message.toString();
        Logger.error("updateRequestStatus", msg);
        return res.status(500).json({ error: true, message: msg });
      }
      Logger.error(
        "updateRequestStatus",
        "Could not update requets status due to unknown error"
      );
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  static async removeTransaction(req: Request, res: Response) {
    Logger.start("removeTransaction");
    try {
      const { documentId, agentId } = req.body;

      if (!documentId) {
        Logger.error("removeTransaction", "documentId is required");
        return res
          .status(400)
          .json({ error: true, message: "documentId is required" });
      }

      // Find all transactions with the provided documentId (and agentId if available)
      const query = { documentId: documentId } as any;
      if (agentId) query.agentId = agentId;

      const transactions = await Transaction.find(query);

      if (transactions.length === 0) {
        Logger.error("removeTransaction", "No transactions found");
        return res
          .status(404)
          .json({ error: true, message: "No transactions found" });
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
          Logger.error("removeTransaction", "User not found");
          return res
            .status(404)
            .json({ error: true, message: "User not found" });
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
      Logger.end("removeTransaction");
      return res.status(200).json({
        error: false,
        message: "Transactions deleted and users' balances updated",
      });
    } catch (error) {
      if (error instanceof Error) {
        const msg = error.message.toString();
        Logger.error("removeTransaction", msg);
        return res.status(500).json({ error: true, message: msg });
      }
      Logger.error("removeTransaction", "Unhandled Error occured");
      return res
        .status(500)
        .json({ error: true, message: "Internal server error" });
    }
  }
}

export default UserController;
