import Logger from "../utils/logger";
import { Request, Response } from "express";
import UserService from "../services/user.service";
import BonusesTransaction, { ITransaction } from "../models/bonuses.schema";
import TelegramBot from "node-telegram-bot-api";
import i18n from "../utils/i18n";
import { PurchaseRequest } from "../models/requests.schema";
import MoneyTransaction from "../models/money.schema";
import User from "../models/users.schema";

class UserController {
  // private bot: TelegramBot;
  // constructor(bot: TelegramBot) {
  //   this.bot = bot;
  // }

  // Adding money controller
  static async addMoney(req: Request, res: Response, bot: TelegramBot): Promise<void> {
    Logger.start("addMoney");

    try {
      const { phoneNumber, sum, description, documentId, agentId, date } = req.body;

      if (!phoneNumber || isNaN(sum) || !documentId || !agentId || !date) {
        Logger.error("addMoney", "Invalid arguments provided");
        res.status(400).json({ error: true, message: "Invalid args provided" });
        return;
      }

      // Validate date format (dd.mm.yyyy)
      const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;

      if (!dateRegex.test(date)) {
        Logger.error("addMoney", "Invalid date format");
        res.status(400).json({
          error: true,
          message: "Invalid date format. Expected format: dd.mm.yyyy",
        });
        return;
      }

      // Check if the date is valid
      const [day, month, year] = date.split(".").map(Number);
      const parsedDate = new Date(`${year}-${month}-${day}`);

      if (
        parsedDate.getFullYear() !== year ||
        parsedDate.getMonth() + 1 !== month ||
        parsedDate.getDate() !== day
      ) {
        Logger.error("addMoney", "Invalid date value");
        res.status(400).json({
          error: true,
          message: "Invalid date value. Please provide a valid date.",
        });
        return;
      }

      // Sum cannot be negative
      if (sum < 0) {
        Logger.error("addMoney", "sum cannot be negative");
        res.status(400).json({
          error: true,
          message: "Invalid args provided. Sum cannot be negative",
        });
        return;
      }

      // Find user by phone number
      const user = await UserService.findUserByPhoneNumber(phoneNumber);

      if (!user) {
        Logger.error("addMoney", "User not found");
        res.status(404).json({ error: true, message: "User not found" });
        return;
      }

      const existingTransaction = await MoneyTransaction.findOne({
        documentId,
        agentId,
        userId: user.id,
      });

      if (existingTransaction && existingTransaction.sum !== sum) {
        const correctedSum = existingTransaction.sum;

        // Inform user about correction
        await bot.sendMessage(
          user.chatId,
          `${i18n.t("correction")}: ${correctedSum} 🔄 ${sum} ${i18n.t("$")}\n${i18n.t(
            "description",
          )}: ${description}`,
        );

        existingTransaction.sum = sum;
        existingTransaction.save();

        res.status(200).json({
          error: false,
          message: "Transaction Corrected Successfully",
        });
        return;
      } else if (existingTransaction && existingTransaction.sum === sum) {
        Logger.error("addMoney", "Transaction already exists with the same sum");

        res.status(409).json({ error: true, message: "Transaction already exists" });
        return;
      } else {
        const transaction = await MoneyTransaction.create({
          userId: user.id,
          documentId,
          agentId,
          sum,
          transactionType: "money",
          date,
          description,
        });

        await transaction.save();
        user.money += sum; // Update user's balance
        await user.save();
      }

      // Inform user about balance update
      await bot.sendMessage(
        user.chatId,
        `${i18n.t("bonuses_addition")}: ${sum} ${i18n.t("$")}\n${i18n.t(
          "description",
        )}: ${description}`,
      );

      Logger.end("addMoney", "Money added");
      res.status(200).json({ error: false, message: "Money added", agentId });
      return;
    } catch (error) {
      if (error instanceof Error) {
        Logger.error("addMoney", error.message);
        res.status(500).json({ error: true, message: "Internal server error" });
        return;
      }
    }
  }

  // remove money
  static async removeMoney(req: Request, res: Response, bot: TelegramBot): Promise<void> {
    Logger.start("removeMoney");

    try {
      const { phoneNumber, sum, description, documentId, agentId, date } = req.body;

      if (!phoneNumber || isNaN(sum) || !documentId || !agentId || !date) {
        Logger.error("removeMoney", "Invalid arguments provided");
        res.status(400).json({ error: true, message: "Invalid args provided" });
        return;
      }

      // Validate date format (dd.mm.yyyy)
      const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;

      if (!dateRegex.test(date)) {
        Logger.error("removeMoney", "Invalid date format");
        res.status(400).json({
          error: true,
          message: "Invalid date format. Expected format: dd.mm.yyyy",
        });
        return;
      }

      // Check if the date is valid
      const [day, month, year] = date.split(".").map(Number);
      const parsedDate = new Date(`${year}-${month}-${day}`);

      if (
        parsedDate.getFullYear() !== year ||
        parsedDate.getMonth() + 1 !== month ||
        parsedDate.getDate() !== day
      ) {
        Logger.error("removeMoney", "Invalid date value");
        res.status(400).json({
          error: true,
          message: "Invalid date value. Please provide a valid date.",
        });
        return;
      }

      if (sum < 0) {
        Logger.error("removeMoney", "sum cannot be negative");
        res.status(400).json({
          error: true,
          message: "Invalid args provided. Sum cannot be negative",
        });
        return;
      }

      const user = await UserService.findUserByPhoneNumber(phoneNumber);

      if (!user) {
        Logger.error("removeMoney", "User not found");
        res.status(404).json({ error: true, message: "User not found" });
        return;
      }

      const existingTransaction = await MoneyTransaction.findOne({
        documentId,
        agentId,
        userId: user.id,
      });

      if (existingTransaction && existingTransaction.sum !== -sum) {
        const correctedSum = existingTransaction.sum;

        // Inform user about correction
        await bot.sendMessage(
          user.chatId,
          `${i18n.t("correction")}: ${correctedSum} 🔄 -${sum} ${i18n.t("$")}\n${i18n.t(
            "description",
          )}: ${description}`,
        );

        existingTransaction.sum = sum;

        res.status(200).json({
          error: false,
          message: "Transaction Corrected Successfully",
        });
        return;
      } else if (existingTransaction && existingTransaction.sum === -sum) {
        Logger.error("removeMoney", "Transaction already exists with the same sum");
        res.status(409).json({ error: true, message: "Transaction already exists" });
        return;
      } else {
        const transaction = await MoneyTransaction.create({
          userId: user.id,
          documentId,
          agentId,
          sum: -sum,
          transactionType: "money",
          date,
          description,
        });

        await transaction.save();
        user.money -= sum; // Update user's balance
        await user.save();
      }

      // Inform user about balance update
      await bot.sendMessage(
        user.chatId,
        `${i18n.t("bonuses_removal")}: -${sum} ${i18n.t("$")}\n${i18n.t(
          "description",
        )}: ${description}`,
      );

      Logger.end("removeMoney", "Money removed");
      res.status(200).json({ error: false, message: "Money removed", agentId });
      return;
    } catch (error) {
      Logger.error("removeMoney", "Unhandled error occurred while removing money");

      if (error instanceof Error) {
        res.status(500).json({ error: true, message: error.message });
        return;
      }

      res.status(500).json({ error: true, message: "Internal server error" });
      return;
    }
  }

  // delete  money transactions
  static async removeMoneyTransaction(
    req: Request,
    res: Response,
    bot: TelegramBot,
  ): Promise<void> {
    Logger.start("removeMoneyTransaction");

    try {
      const { documentId, agentId } = req.body;

      if (!documentId) {
        Logger.error("removeMoneyTransaction", "documentId is required");
        res.status(400).json({ error: true, message: "documentId is required" });
        return;
      }

      // Define query for finding transactions
      const query: any = { documentId };

      if (agentId) query.agentId = agentId;

      // Retrieve transactions based on the query
      const transactions = await MoneyTransaction.find(query);

      if (transactions.length === 0) {
        Logger.error("removeMoneyTransaction", "No transactions found");
        res.status(404).json({ error: true, message: "No transactions found" });
        return;
      }

      // Track user balance adjustments
      const userAdjustments = new Map<string, number>(); // Map to store net balance adjustments for each user

      // Calculate net balance adjustments for all users
      for (const transaction of transactions) {
        const userId = transaction.userId.toString();
        if (!userAdjustments.has(userId)) {
          userAdjustments.set(userId, 0);
        }
        userAdjustments.set(userId, userAdjustments.get(userId)! - transaction.sum);
      }

      // Apply balance adjustments and notify users
      for (const [userId, balanceAdjustment] of userAdjustments.entries()) {
        const user = await User.findById(userId);
        if (user) {
          const oldBalance = user.money || 0;
          user.money += balanceAdjustment; // Adjust balance
          await user.save();

          // Determine the message based on the balance adjustment
          let adjustmentMessage: string;
          if (balanceAdjustment < 0) {
            adjustmentMessage = `${i18n.t("money_balance_negative_update")} ${Math.abs(
              balanceAdjustment,
            )} ${i18n.t("$")}`;
          } else {
            adjustmentMessage = `${i18n.t("money_balance_positive_update")} ${Math.abs(
              balanceAdjustment,
            )} ${i18n.t("$")}`;
          }

          // Notify the user
          if (user.chatId) {
            await bot.sendMessage(
              user.chatId,
              `${adjustmentMessage}. ${i18n.t("new_balance")}: ${user.money} ${i18n.t("$")}.`,
            );
          }

          Logger.warn(
            "removeMoneyTransaction",
            `User ${userId}: Balance updated from ${oldBalance} to ${user.money}`,
          );
        } else {
          Logger.error("removeMoneyTransaction", `User with ID ${userId} not found`);
        }
      }

      // Delete all transactions with the specified documentId
      await MoneyTransaction.deleteMany(query);

      Logger.end("removeMoneyTransaction");
      res.status(200).json({
        error: false,
        message: "Transactions deleted, and users' balances updated.",
      });
      return;
    } catch (error) {
      if (error instanceof Error) {
        Logger.error("removeMoneyTransaction", "Unhandled Error occurred: " + error.message);
      } else {
        Logger.error("removeMoneyTransaction", "Unhandled Error occurred");
      }
      res.status(500).json({ error: true, message: "Internal server error" });
      return;
    }
  }

  // Add Bonuses
  static async addBonuses(req: Request, res: Response, bot: TelegramBot): Promise<void> {
    Logger.start("addBonuses");

    try {
      const { phoneNumber, sum, description, documentId, agentId } = req.body;

      if (!phoneNumber || isNaN(sum) || !documentId || !agentId) {
        Logger.error("addBonuses", "Invalid arguments provided");
        res.status(400).json({ error: true, message: "Invalid args provided" });
        return;
      }

      if (sum < 0) {
        Logger.error("addBonuses", "Sum cannot be negative");
        res.status(400).json({ error: true, message: "Sum cannot be negative" });
        return;
      }

      // Find user by phoneNumber
      const user = await UserService.findUserByPhoneNumber(phoneNumber);

      // If user not found return error
      if (!user) {
        Logger.error("addBonuses", "User not found");
        res.status(404).json({ error: true, message: "User not found" });
        return;
      }

      // Check if a transaction with the same documentId and agentId already exists
      let transaction = await BonusesTransaction.findOne({
        userId: user.id,
        documentId: documentId,
        agentId: agentId,
        transactionType: "bonuses",
      });

      if (transaction) {
        // Update existing transaction
        transaction.sum = sum;
        await transaction.save();
        Logger.warn("addBonuses", "Existing transaction updated");
      } else {
        // Create a new transaction for adding bonuses
        transaction = new BonusesTransaction({
          userId: user.id,
          documentId: documentId,
          agentId: agentId,
          sum: sum,
          description: description,
          transactionType: "bonuses", // Differentiating as bonuses transaction
        });
        await transaction.save();
        Logger.warn("addBonuses", "New transaction created");
      }

      // Update user's bonuses balance based only on bonuses transactions
      await UserService.updateBonusesBalance(user.id);

      // Notify user of balance update
      if (user.chatId) {
        await bot.sendMessage(
          user.chatId,
          `${i18n.t("bonuses_addition")}: ${sum} ${i18n.t("coins")}\n${i18n.t(
            "description",
          )}: ${description}`,
        );
      }

      Logger.end("addBonuses", "Bonuses are added or updated");
      res.status(200).json({
        error: false,
        message: transaction.isNew ? "Bonuses added" : "Bonuses updated",
        agentId,
      });
      return;
    } catch (error) {
      Logger.error("addBonuses", "Unhandled error occurred while adding bonuses");
      if (error instanceof Error) {
        res.status(500).json({ error: true, message: error.message });
        return;
      } else {
        res.status(500).json({
          error: true,
          message: "Internal Server Error. Unknown error occurred",
        });
        return;
      }
    }
  }

  // Remove Bonuses
  static async removeBonuses(req: Request, res: Response, bot: TelegramBot): Promise<void> {
    Logger.start("removeBonuses");

    try {
      const { phoneNumber, sum, description, documentId, agentId } = req.body;

      if (!phoneNumber || isNaN(sum) || !documentId || !agentId) {
        Logger.error("removeBonuses", "Invalid Arguments provided in request");
        res.status(400).json({
          error: true,
          message: "Invalid args provided. phoneNumber, sum, documentId, and agentId are required.",
        });
        return;
      }

      if (sum < 0) {
        Logger.error("removeBonuses", "sum cannot be negative");
        res.status(400).json({
          error: true,
          message: "Invalid args provided. Sum cannot be negative",
        });
        return;
      }

      // Find user by phoneNumber
      const user = await UserService.findUserByPhoneNumber(phoneNumber);
      if (!user) {
        Logger.error("removeBonuses", "User not found");
        res.status(404).json({ error: true, message: "User not found" });
        return;
      }

      // If the user's bonuses balance is insufficient, return an error
      if ((user.bonuses || 0) < sum) {
        Logger.error("removeBonuses", "User has insufficient bonuses");
        res.status(400).json({
          error: true,
          message: "Not enough sum",
          currentBalance: user.bonuses,
        });
        return;
      }

      // Check if a transaction with the same documentId and agentId already exists
      let transaction = await BonusesTransaction.findOne({
        userId: user.id,
        documentId: documentId,
        agentId: agentId,
        transactionType: "bonuses",
      });

      if (transaction) {
        // Update existing transaction
        transaction.sum = -sum;
        transaction.description = description;
        await transaction.save();
        Logger.warn("removeBonuses", "Existing transaction updated");
      } else {
        // Create a new transaction with a negative sum for removing bonuses
        transaction = new BonusesTransaction({
          userId: user.id,
          documentId: documentId,
          agentId: agentId,
          sum: -sum,
          description: description,
          transactionType: "bonuses", // Differentiating as bonuses transaction
        });
        await transaction.save();
      }

      // Update bonuses balance based only on bonuses transactions
      const updatedBonuses = await UserService.updateBonusesBalance(user.id);

      // Notify user of balance deduction
      if (user.chatId) {
        await bot.sendMessage(
          user.chatId,
          `${i18n.t("bonuses_removal")}: ${sum} ${i18n.t("coins")}\n${i18n.t(
            "description",
          )}: ${description}\n${i18n.t("updated_balance")}: ${updatedBonuses}`,
        );
      }

      Logger.end("removeBonuses", "Bonuses removed or updated");
      res.status(200).json({
        error: false,
        message: transaction.isNew ? "Bonuses removed" : "Bonuses updated",
        newBalance: updatedBonuses,
        agentId,
      });
      return;
    } catch (error) {
      Logger.error("removeBonuses", "Unhandled error occurred while removing bonuses");
      if (error instanceof Error) {
        res.status(500).json({ error: true, message: error.message });
        return;
      } else {
        res.status(500).json({
          error: true,
          message: "Internal server error. Unknown error occurred",
        });
        return;
      }
    }
  }

  // Remove Admin by phoneNumber
  static async removeSudo(req: Request, res: Response, bot:TelegramBot): Promise<void> {
    Logger.start("removeSudo");

    try {
      const { phoneNumber } = req.body;

      //If phoneNumber is not provided return error
      if (!phoneNumber) {
        Logger.error("removeSudo", "Phone is required");
        res.status(400).json({ error: true, message: "Phone is required" });
        return;
      }

      // Find user via phoneNumber
      const user = await UserService.findUserByPhoneNumber(phoneNumber);

      //If user not found return error
      if (!user) {
        Logger.error("removeSudo", "User not found");
        res.status(404).json({ error: true, message: "user not found" });
        return;
      }

      // init vars
      const username = user.name;

      // if User is not an admin no need to update isAdmin status
      if (!user.isSudo) {
        Logger.warn("removeSudo", "Tried to remove sudo privileges from user who is not sudo");
        Logger.end("removeSudo");
        res.status(200).json({
          error: false,
          message: "user not sudo",
          username,
          isSudo: false,
          isAdmin: false,
        });
      } else {
        // update isAdmin status -> false
        await UserService.updateUserAdminStatus(phoneNumber, false);
        await UserService.updateUserSudoStatus(phoneNumber, false);

        // Send Message to restart bot
        await bot.sendMessage(user.chatId, i18n.t("sudo_removed_notification"));

        Logger.end("removeSudo");

        // return status OK since isAdmin status is updated
        res.status(200).json({
          error: false,
          message: "User sudo has been removed",
          username,
          isSudo: false,
        });
        return;
      }
      // Update this code to return the ERROR itself
    } catch (error) {
      Logger.error("removeSudo", "Error occured while removing sudo");
      res.status(500).json({ message: "Internal server error" });
      return;
    }
  }

  static async removeAdmin(req: Request, res: Response, bot:TelegramBot): Promise<void> {
    Logger.start("removeAdmin");

    try {
      const { phoneNumber } = req.body;

      //If phoneNumber is not provided return error
      if (!phoneNumber) {
        Logger.error("removeAdmin", "Phone is required");
        res.status(400).json({ error: true, message: "Phone is required" });
        return;
      }

      // Find user via phoneNumber
      const user = await UserService.findUserByPhoneNumber(phoneNumber);

      //If user not found return error
      if (!user) {
        Logger.error("removeAdmin", "User not found");
        res.status(404).json({ error: true, message: "user not found" });
        return;
      }

      // init vars
      const username = user.name;

      // if User is not an admin no need to update isAdmin status
      if (!user.isAdmin) {
        Logger.warn(
          "removeAdmin",
          "Tried to remove admin privileges from user who is not an admin",
        );
        Logger.end("removeAdmin");
        res.status(200).json({
          error: false,
          message: "Status is not updated since user is not an admin",
          username,
          isAdmin: false,
        });
      } else {
        // update isAdmin status -> false
        await UserService.updateUserAdminStatus(phoneNumber, false);

        // Send Message to restart bot
        await bot.sendMessage(user.chatId, i18n.t("admin_removed_notification"));

        Logger.end("removeAdmin");

        // return status OK since isAdmin status is updated
        res.status(200).json({
          error: false,
          message: "User admin has been removed",
          username,
          isAdmin: false,
        });
        return;
      }
      // Update this code to return the ERROR itself
    } catch (error) {
      Logger.error("removeAdmin", "Error occured while removing admin");
      res.status(500).json({ message: "Internal server error" });
      return;
    }
  }

  static async addSudo(req: Request, res: Response, bot:TelegramBot): Promise<void> {
    Logger.start("addSudo");

    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        Logger.error("addSudo", "Phone number is required");
        res.status(400).json({ error: true, message: "Phone number is required" });
        return;
      }
      // find user
      const user = await UserService.findUserByPhoneNumber(phoneNumber);

      // if user not found return status 404
      if (!user) {
        Logger.error("addAdmin", "User not found");
        res.status(404).json({ message: "user not found" });
        return;
      }

      const username = user.name;

      // User is already an admin
      if (user.isSudo && user.isAdmin) {
        // Log actoins
        Logger.warn("addAdmin", "Tried to add sudo privileges to the user who is already sudo");
        Logger.end("addSudo");

        // Return status OK since user is already an admin
        res.status(200).json({
          error: false,
          message: "User already sudo",
          username,
          isSudo: true,
        });
        return;
        // Update user status and return status OK
      } else {
        await UserService.updateUserAdminStatus(phoneNumber, true);
        await UserService.updateUserSudoStatus(phoneNumber, true);
        Logger.end("addSudo");

        // Notify to restart bot
        await bot.sendMessage(user.chatId, i18n.t("sudo_granted_notification"));

        // return status OK when isAdin is updated to true
        res.status(200).json({
          error: false,
          message: "User granted sudo privileges",
          username,
          isSudo: true,
        });
        return;
      }
      // catch the unhadlned error during the code
    } catch (error) {
      // if error of type ERROR return the error itself
      if (error instanceof Error) {
        Logger.error("addSudo", "Could not update sudo status for the user");
        res.status(500).json({ error: true, message: error.message });
        return;
      } else {
        Logger.error("addSudo", "Unknown Error occured while updating user isAdmin status");
        res.status(500).json({ error: true, message: "Internal Server Error" });
        return;
      }
    }
  }

  // Add Admin by phoneNumber
  static async addAdmin(req: Request, res: Response, bot:TelegramBot): Promise<void> {
    Logger.start("addAdmin");

    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        Logger.error("addAdmin", "Phone number is required");

        res.status(400).json({ error: true, message: "Phone number is required" });
        return;
      }
      // find user
      const user = await UserService.findUserByPhoneNumber(phoneNumber);

      // if user not found return status 404
      if (!user) {
        Logger.error("addAdmin", "User not found");
        res.status(404).json({ message: "user not found" });
        return;
      }

      const username = user.name;

      // User is already an admin
      if (user.isAdmin) {
        // Log actoins
        Logger.warn("addAdmin", "Tried to add admin privileges to the user who is already admin");
        Logger.end("addAdmin");

        // Return status OK since user is already an admin
        res.status(200).json({
          error: false,
          message: "User is already an admin",
          username,
          isAdmin: true,
        });
        return;

        // Update user status and return status OK
      } else {
        await UserService.updateUserAdminStatus(phoneNumber, true);
        Logger.end("addAdmin");

        // Notify to restart bot
        await bot.sendMessage(user.chatId, i18n.t("admin_granted_notification"));

        // return status OK when isAdin is updated to true
        res.status(200).json({
          error: false,
          message: "User granted admin privileges",
          username,
          isAdmin: true,
        });
        return;
      }
      // catch the unhadlned error during the code
    } catch (error) {
      // if error of type ERROR return the error itself
      if (error instanceof Error) {
        Logger.error("addAdmin", "Could not admin status for the user");
        res.status(500).json({ error: true, message: error.message });
        return;
      } else {
        Logger.error("addAdmin", "Unknown Error occured while updating user isAdmin status");
        res.status(500).json({ error: true, message: "Internal Server Error" });
        return;
      }
    }
  }

  //Update isActive Request
  static async updateRequestStatus(req: Request, res: Response, bot:TelegramBot): Promise<void> {
    Logger.start("updateRequestStatus");
    try {
      const { phoneNumber } = req.body;
      const user = await UserService.findUserByPhoneNumber(phoneNumber);

      if (!phoneNumber) {
        Logger.error("updateRequestStatus", "phonenumbe is required to update request status");
        res.status(400).json({ error: true, message: "Phone number is required" });
        return;
      }

      if (!user) {
        Logger.error("updateRequestStatus", "User not found");
        res.status(400).json({ error: true, message: "User not found" });
        return;
      }

      const purchaseRequest = await PurchaseRequest.findOneAndUpdate(
        { phoneNumber: phoneNumber, isActive: true },
        //property to update
        { isActive: false },
      );

      if (!purchaseRequest) {
        Logger.error("updateRequestStatus", "Purchase Request is not found");
        res.status(404).json({ error: true, message: "Purchase request is not found" });
        return;
      }

      const username = purchaseRequest.username;
      const isActive = purchaseRequest.isActive;

      if (!isActive) {
        Logger.warn(
          "updateRequestStatus",
          "Tried to update purchase request status that is already NOT active",
        );

        res.status(200).json({
          error: false,
          message: "Tried to update purchase request status that is already NOT active",
          username,
          isActive,
        });
        return;
      }
      await bot.sendMessage(user.chatId, i18n.t("request_status_update"));
      Logger.end("updatePurchaseRequeset");
      res.status(200).json({
        error: false,
        message: "The Request status is updated",
        username,
        isActive: false,
      });
      return;
    } catch (error) {
      if (error instanceof Error) {
        const msg = error.message.toString();
        Logger.error("updateRequestStatus", msg);
        res.status(500).json({ error: true, message: msg });
        return;
      }
      Logger.error("updateRequestStatus", "Could not update requets status due to unknown error");
      res.status(500).json({ message: "Internal server error" });
      return;
    }
  }

  // Delete transactions by documentId and agentId
  static async removeBonusesTransaction(req: Request, res: Response, bot:TelegramBot): Promise<void> {
    Logger.start("removeTransaction");
    try {
      const { documentId, agentId } = req.body;

      if (!documentId) {
        Logger.error("removeTransaction", "documentId is required");
        res.status(400).json({ error: true, message: "documentId is required" });
        return;
      }

      // Find all transactions with the provided documentId (and agentId if available)
      const query = { documentId: documentId } as any;
      if (agentId) query.agentId = agentId;

      const transactions = await BonusesTransaction.find(query);

      if (transactions.length === 0) {
        Logger.error("removeTransaction", "No transactions found");
        res.status(404).json({ error: true, message: "No transactions found" });
        return;
      }

      // Track user balances that need to be updated
      const userBalances = new Map<string, number>();

      for (const transaction of transactions) {
        // Accumulate the total sum adjustment for each user
        if (!userBalances.has(transaction.userId.toString())) {
          userBalances.set(transaction.userId.toString(), 0);
        }

        const currentAdjustment = userBalances.get(transaction.userId.toString()) || 0;
        userBalances.set(transaction.userId.toString(), currentAdjustment + transaction.sum);
      }

      // Update each user's balance based on accumulated adjustments
      for (const [userId, adjustment] of userBalances.entries()) {
        const user = await User.findById(userId);

        if (!user) {
          Logger.error("removeTransaction", "User not found");
          res.status(404).json({ error: true, message: "User not found" });
          return;
        }

        user.bonuses = (user.bonuses || 0) - adjustment;
        await user.save();

        // Notify the user
        if (user.chatId) {
          const adjustmentMessage =
            adjustment < 0
              ? `${i18n.t("bonuses_balance_positive_update")} ${Math.abs(adjustment)}`
              : `${i18n.t("bonuses_balance_negative_update")} ${adjustment}`;

          await bot.sendMessage(user.chatId, adjustmentMessage);
        }
      }

      // Delete all found transactions
      await BonusesTransaction.deleteMany(query);
      Logger.end("removeTransaction");
      res.status(200).json({
        error: false,
        message: "Transactions deleted and users' balances updated",
      });
      return;
    } catch (error) {
      if (error instanceof Error) {
        const msg = error.message.toString();
        Logger.error("removeTransaction", msg);
        res.status(500).json({ error: true, message: msg });
        return;
      }
      Logger.error("removeTransaction", "Unhandled Error occured");
      res.status(500).json({ error: true, message: "Internal server error" });
      return;
    }
  }
}

export default UserController;
