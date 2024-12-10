import Logger from "../utils/logger";
import { Request, Response } from "express";
import UserService from "../services/user.service";
import BonusesTransaction, {
  ITransaction,
} from "../models/bonuses-transactions.schema";
import TelegramBot from "node-telegram-bot-api";
import i18n from "../utils/i18n";
import { PurchaseRequest } from "../models/purchase-requests.schema";
import MoneyTransaction from "../models/money-transactions.schema";
import User from "../models/users.schema";

class UserController {
  private bot: TelegramBot;

  constructor(bot: TelegramBot) {
    this.bot = bot;
  }
  // dont update everytime adding, removing, correcting or deleting money
  // write a updateUserBalance and use it everytime user generates reconciliation act
  // update user's balance history by corrected transaction
  async addMoney(req: Request, res: Response) {
    Logger.start("addMoney");

    try {
      const { phoneNumber, sum, description, documentId, agentId, date } =
        req.body;

      if (!phoneNumber || isNaN(sum) || !documentId || !agentId || !date) {
        Logger.error("addMoney", "Invalid arguments provided");
        return res
          .status(400)
          .json({ error: true, message: "Invalid args provided" });
      }

      // Validate date format (dd.mm.yyyy)
      const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;
      if (!dateRegex.test(date)) {
        Logger.error("addMoney", "Invalid date format");
        return res.status(400).json({
          error: true,
          message: "Invalid date format. Expected format: dd.mm.yyyy",
        });
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
        return res.status(400).json({
          error: true,
          message: "Invalid date value. Please provide a valid date.",
        });
      }

      // Sum cannot be negative
      if (sum < 0) {
        Logger.error("addMoney", "sum cannot be negative");
        return res.status(400).json({
          error: true,
          message: "Invalid args provided. Sum cannot be negative",
        });
      }

      // Find user by phone number
      const user = await UserService.findUserByPhoneNumber(phoneNumber);

      if (!user) {
        Logger.error("addMoney", "User not found");
        return res.status(404).json({ error: true, message: "User not found" });
      }

      const existingTransaction = await MoneyTransaction.findOne({
        documentId,
        agentId,
        userId: user.id,
      });

      if (existingTransaction && existingTransaction.sum !== sum) {
        const correctedSum = existingTransaction.sum;

        // Inform user about correction
        await this.bot.sendMessage(
          user.chatId,
          `${i18n.t("correction")}: ${correctedSum} 🔄 ${sum} ${i18n.t(
            "$"
          )}\n${i18n.t("description")}: ${description}`
        );

        existingTransaction.sum = sum;
        existingTransaction.save();

        return res.status(200).json({
          error: false,
          message: "Transaction Corrected Successfully",
        });
      } else if (existingTransaction && existingTransaction.sum === sum) {
        Logger.error(
          "addMoney",
          "Transaction already exists with the same sum"
        );

        return res
          .status(409)
          .json({ error: true, message: "Transaction already exists" });
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
      await this.bot.sendMessage(
        user.chatId,
        `${i18n.t("bonuses_addition")}: ${sum} ${i18n.t("$")}\n${i18n.t(
          "description"
        )}: ${description}`
      );

      Logger.end("addMoney", "Money added");
      return res
        .status(200)
        .json({ error: false, message: "Money added", agentId });
    } catch (error) {
      if (error instanceof Error) {
        Logger.error("addMoney", error.message);
        return res
          .status(500)
          .json({ error: true, message: "Internal server error" });
      }
    }
  }

  // remove money
  async removeMoney(req: Request, res: Response) {
    Logger.start("removeMoney");

    try {
      const { phoneNumber, sum, description, documentId, agentId, date } =
        req.body;

      if (!phoneNumber || isNaN(sum) || !documentId || !agentId || !date) {
        Logger.error("removeMoney", "Invalid arguments provided");
        return res
          .status(400)
          .json({ error: true, message: "Invalid args provided" });
      }

      // Validate date format (dd.mm.yyyy)
      const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;

      if (!dateRegex.test(date)) {
        Logger.error("removeMoney", "Invalid date format");
        return res.status(400).json({
          error: true,
          message: "Invalid date format. Expected format: dd.mm.yyyy",
        });
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
        return res.status(400).json({
          error: true,
          message: "Invalid date value. Please provide a valid date.",
        });
      }

      if (sum < 0) {
        Logger.error("removeMoney", "sum cannot be negative");
        return res.status(400).json({
          error: true,
          message: "Invalid args provided. Sum cannot be negative",
        });
      }

      const user = await UserService.findUserByPhoneNumber(phoneNumber);

      if (!user) {
        Logger.error("removeMoney", "User not found");
        return res.status(404).json({ error: true, message: "User not found" });
      }

      const existingTransaction = await MoneyTransaction.findOne({
        documentId,
        agentId,
        userId: user.id,
      });

      if (existingTransaction && existingTransaction.sum !== -sum) {
        const correctedSum = existingTransaction.sum;

        // Inform user about correction
        await this.bot.sendMessage(
          user.chatId,
          `${i18n.t("correction")}: ${correctedSum} 🔄 -${sum} ${i18n.t(
            "$"
          )}\n${i18n.t("description")}: ${description}`
        );
        existingTransaction.sum = sum;

        return res.status(200).json({
          error: false,
          message: "Transaction Corrected Successfully",
        });
      } else if (existingTransaction && existingTransaction.sum === -sum) {
        Logger.error(
          "removeMoney",
          "Transaction already exists with the same sum"
        );
        return res
          .status(409)
          .json({ error: true, message: "Transaction already exists" });
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
      await this.bot.sendMessage(
        user.chatId,
        `${i18n.t("bonuses_removal")}: -${sum} ${i18n.t("$")}\n${i18n.t(
          "description"
        )}: ${description}`
      );

      Logger.end("removeMoney", "Money removed");
      return res
        .status(200)
        .json({ error: false, message: "Money removed", agentId });
    } catch (error) {
      Logger.error(
        "removeMoney",
        "Unhandled error occurred while removing money"
      );
      if (error instanceof Error) {
        return res.status(500).json({ error: true, message: error.message });
      }
      return res
        .status(500)
        .json({ error: true, message: "Internal server error" });
    }
  }

  // delete  money transactions
  public async removeMoneyTransaction(req: Request, res: Response) {
    Logger.start("removeMoneyTransaction");

    try {
      const { documentId, agentId } = req.body;

      if (!documentId) {
        Logger.error("removeMoneyTransaction", "documentId is required");
        return res
          .status(400)
          .json({ error: true, message: "documentId is required" });
      }

      // Define query for finding transactions
      const query: any = { documentId };

      if (agentId) query.agentId = agentId;

      // Retrieve transactions based on the query
      const transactions = await MoneyTransaction.find(query);

      if (transactions.length === 0) {
        Logger.error("removeMoneyTransaction", "No transactions found");
        return res
          .status(404)
          .json({ error: true, message: "No transactions found" });
      }

      // Track user balance adjustments
      const userAdjustments = new Map<string, number>(); // Map to store net balance adjustments for each user

      // Calculate net balance adjustments for all users
      for (const transaction of transactions) {
        const userId = transaction.userId.toString();
        if (!userAdjustments.has(userId)) {
          userAdjustments.set(userId, 0);
        }
        userAdjustments.set(
          userId,
          userAdjustments.get(userId)! - transaction.sum
        );
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
            adjustmentMessage = `${i18n.t(
              "money_balance_negative_update"
            )} ${Math.abs(balanceAdjustment)} ${i18n.t("$")}`;
          } else {
            adjustmentMessage = `${i18n.t(
              "money_balance_positive_update"
            )} ${Math.abs(balanceAdjustment)} ${i18n.t("$")}`;
          }

          // Notify the user
          if (user.chatId) {
            await this.bot.sendMessage(
              user.chatId,
              `${adjustmentMessage}. ${i18n.t("new_balance")}: ${
                user.money
              } ${i18n.t("$")}.`
            );
          }

          Logger.warn(
            "removeMoneyTransaction",
            `User ${userId}: Balance updated from ${oldBalance} to ${user.money}`
          );
        } else {
          Logger.error(
            "removeMoneyTransaction",
            `User with ID ${userId} not found`
          );
        }
      }

      // Delete all transactions with the specified documentId
      await MoneyTransaction.deleteMany(query);

      Logger.end("removeMoneyTransaction");
      return res.status(200).json({
        error: false,
        message: "Transactions deleted, and users' balances updated.",
      });
    } catch (error) {
      if (error instanceof Error) {
        Logger.error(
          "removeMoneyTransaction",
          "Unhandled Error occurred: " + error.message
        );
      } else {
        Logger.error("removeMoneyTransaction", "Unhandled Error occurred");
      }
      return res
        .status(500)
        .json({ error: true, message: "Internal server error" });
    }
  }

  // Add Bonuses
  async addBonuses(req: Request, res: Response) {
    Logger.start("addBonuses");

    try {
      const { phoneNumber, sum, description, documentId, agentId } = req.body;

      if (!phoneNumber || isNaN(sum) || !documentId || !agentId) {
        Logger.error("addBonuses", "Invalid arguments provided");
        return res
          .status(400)
          .json({ error: true, message: "Invalid args provided" });
      }

      if (sum < 0) {
        Logger.error("addBonuses", "Sum cannot be negative");
        return res
          .status(400)
          .json({ error: true, message: "Sum cannot be negative" });
      }

      // Find user by phoneNumber
      const user = await UserService.findUserByPhoneNumber(phoneNumber);

      // If user not found return error
      if (!user) {
        Logger.error("addBonuses", "User not found");
        return res.status(404).json({ error: true, message: "User not found" });
      }

      // Check if a transaction with the same documentId and agentId already exists
      let transaction = await BonusesTransaction.findOne({
        userId: user.id,
        documentId: documentId,
        agentId: agentId,
        transactionType: "bonuses",
      });
      console.log(transaction);
      if (transaction) {
        // Update existing transaction
        transaction.sum = sum; // Updat the sum value
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
        await this.bot.sendMessage(
          user.chatId,
          `${i18n.t("bonuses_addition")}: ${sum} ${i18n.t("coins")}\n${i18n.t(
            "description"
          )}: ${description}`
        );
      }

      Logger.end("addBonuses", "Bonuses are added or updated");
      return res.status(200).json({
        error: false,
        message: transaction.isNew ? "Bonuses added" : "Bonuses updated",
        agentId,
      });
    } catch (error) {
      Logger.error(
        "addBonuses",
        "Unhandled error occurred while adding bonuses"
      );
      if (error instanceof Error) {
        return res.status(500).json({ error: true, message: error.message });
      } else {
        return res.status(500).json({
          error: true,
          message: "Internal Server Error. Unknown error occurred",
        });
      }
    }
  }
  // Remove Bonuses
  public async removeBonuses(req: Request, res: Response) {
    Logger.start("removeBonuses");
    try {
      const { phoneNumber, sum, description, documentId, agentId } = req.body;

      if (!phoneNumber || isNaN(sum) || !documentId || !agentId) {
        Logger.error("removeBonuses", "Invalid Arguments provided in request");
        return res.status(400).json({
          error: true,
          message:
            "Invalid args provided. phoneNumber, sum, documentId, and agentId are required.",
        });
      }

      if (sum < 0) {
        Logger.error("removeBonuses", "sum cannot be negative");
        return res.status(400).json({
          error: true,
          message: "Invalid args provided. Sum cannot be negative",
        });
      }

      // Find user by phoneNumber
      const user = await UserService.findUserByPhoneNumber(phoneNumber);
      if (!user) {
        Logger.error("removeBonuses", "User not found");
        return res.status(404).json({ error: true, message: "User not found" });
      }

      // If the user's bonuses balance is insufficient, return an error
      if ((user.bonuses || 0) < sum) {
        Logger.error("removeBonuses", "User has insufficient bonuses");
        return res.status(400).json({
          error: true,
          message: "Not enough sum",
          currentBalance: user.bonuses,
        });
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
        const updatedBonuses = await UserService.updateBonusesBalance(user.id);

        if (user.chatId) {
          await this.bot.sendMessage(
            user.chatId,
            `${i18n.t("bonuses_removal_correction")}: ${sum} ${i18n.t("coins")}\n${i18n.t(
              "description"
            )}: ${description}\n${i18n.t("updated_balance")}: ${updatedBonuses}`
          );
        }

        Logger.end("removeBonuses", "Bonuses removed or updated");
        return res
          .status(200)
          .json({ error: false, message: "Transaction has been updated" });
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
        await this.bot.sendMessage(
          user.chatId,
          `${i18n.t("bonuses_removal")}: ${sum} ${i18n.t("coins")}\n${i18n.t(
            "description"
          )}: ${description}\n${i18n.t("updated_balance")}: ${updatedBonuses}`
        );
      }

      Logger.end("removeBonuses", "Bonuses removed or updated");
      return res.status(200).json({
        error: false,
        message: transaction.isNew ? "Bonuses removed" : "Bonuses updated",
        newBalance: updatedBonuses,
        agentId,
      });
    } catch (error) {
      Logger.error(
        "removeBonuses",
        "Unhandled error occurred while removing bonuses"
      );
      if (error instanceof Error) {
        return res.status(500).json({ error: true, message: error.message });
      } else {
        return res.status(500).json({
          error: true,
          message: "Internal server error. Unknown error occurred",
        });
      }
    }
  }

  // Remove Admin by phoneNumber
  async removeSudo(req: Request, res: Response) {
    Logger.start("removeSudo");

    try {
      const { phoneNumber } = req.body;

      //If phoneNumber is not provided return error
      if (!phoneNumber) {
        Logger.error("removeSudo", "Phone is required");
        return res
          .status(400)
          .json({ error: true, message: "Phone is required" });
      }

      // Find user via phoneNumber
      const user = await UserService.findUserByPhoneNumber(phoneNumber);

      //If user not found return error
      if (!user) {
        Logger.error("removeSudo", "User not found");
        return res.status(404).json({ error: true, message: "user not found" });
      }

      // init vars
      const username = user.name;

      // if User is not an admin no need to update isAdmin status
      if (!user.isSudo) {
        Logger.warn(
          "removeSudo",
          "Tried to remove sudo privileges from user who is not sudo"
        );
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
        await this.bot.sendMessage(
          user.chatId,
          i18n.t("sudo_removed_notification")
        );

        Logger.end("removeSudo");

        // return status OK since isAdmin status is updated
        return res.status(200).json({
          error: false,
          message: "User sudo has been removed",
          username,
          isSudo: false,
        });
      }
      // Update this code to return the ERROR itself
    } catch (error) {
      Logger.error("removeSudo", "Error occured while removing sudo");
      console.error("ERROR: \n", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async removeAdmin(req: Request, res: Response) {
    Logger.start("removeAdmin");

    try {
      const { phoneNumber } = req.body;

      //If phoneNumber is not provided return error
      if (!phoneNumber) {
        Logger.error("removeAdmin", "Phone is required");
        return res
          .status(400)
          .json({ error: true, message: "Phone is required" });
      }

      // Find user via phoneNumber
      const user = await UserService.findUserByPhoneNumber(phoneNumber);

      //If user not found return error
      if (!user) {
        Logger.error("removeAdmin", "User not found");
        return res.status(404).json({ error: true, message: "user not found" });
      }

      // init vars
      const username = user.name;

      // if User is not an admin no need to update isAdmin status
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
          isAdmin: false,
        });
      } else {
        // update isAdmin status -> false
        await UserService.updateUserAdminStatus(phoneNumber, false);

        // Send Message to restart bot
        await this.bot.sendMessage(
          user.chatId,
          i18n.t("admin_removed_notification")
        );

        Logger.end("removeAdmin");

        // return status OK since isAdmin status is updated
        return res.status(200).json({
          error: false,
          message: "User admin has been removed",
          username,
          isAdmin: false,
        });
      }
      // Update this code to return the ERROR itself
    } catch (error) {
      Logger.error("removeAdmin", "Error occured while removing admin");
      console.error("ERROR: \n", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async addSudo(req: Request, res: Response) {
    Logger.start("addSudo");

    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        Logger.error("addSudo", "Phone number is required");

        return res
          .status(400)
          .json({ error: true, message: "Phone number is required" });
      }
      // find user
      const user = await UserService.findUserByPhoneNumber(phoneNumber);

      // if user not found return status 404
      if (!user) {
        Logger.error("addAdmin", "User not found");
        return res.status(404).json({ message: "user not found" });
      }

      const username = user.name;

      // User is already an admin
      if (user.isSudo && user.isAdmin) {
        // Log actoins
        Logger.warn(
          "addAdmin",
          "Tried to add sudo privileges to the user who is already sudo"
        );
        Logger.end("addSudo");

        // Return status OK since user is already an admin
        return res.status(200).json({
          error: false,
          message: "User already sudo",
          username,
          isSudo: true,
        });

        // Update user status and return status OK
      } else {
        await UserService.updateUserAdminStatus(phoneNumber, true);
        await UserService.updateUserSudoStatus(phoneNumber, true);
        Logger.end("addSudo");

        // Notify to restart bot
        await this.bot.sendMessage(
          user.chatId,
          i18n.t("sudo_granted_notification")
        );

        // return status OK when isAdin is updated to true
        return res.status(200).json({
          error: false,
          message: "User granted sudo privileges",
          username,
          isSudo: true,
        });
      }
      // catch the unhadlned error during the code
    } catch (error) {
      // if error of type ERROR return the error itself
      if (error instanceof Error) {
        Logger.error("addSudo", "Could not update sudo status for the user");
        return res.status(500).json({ error: true, message: error.message });
      } else {
        Logger.error(
          "addSudo",
          "Unknown Error occured while updating user isAdmin status"
        );
        return res
          .status(500)
          .json({ error: true, message: "Internal Server Error" });
      }
    }
  }

  // Add Admin by phoneNumber
  async addAdmin(req: Request, res: Response) {
    Logger.start("addAdmin");

    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        Logger.error("addAdmin", "Phone number is required");

        return res
          .status(400)
          .json({ error: true, message: "Phone number is required" });
      }
      // find user
      const user = await UserService.findUserByPhoneNumber(phoneNumber);

      // if user not found return status 404
      if (!user) {
        Logger.error("addAdmin", "User not found");
        return res.status(404).json({ message: "user not found" });
      }

      const username = user.name;

      // User is already an admin
      if (user.isAdmin) {
        // Log actoins
        Logger.warn(
          "addAdmin",
          "Tried to add admin privileges to the user who is already admin"
        );
        Logger.end("addAdmin");

        // Return status OK since user is already an admin
        return res.status(200).json({
          error: false,
          message: "User is already an admin",
          username,
          isAdmin: true,
        });

        // Update user status and return status OK
      } else {
        await UserService.updateUserAdminStatus(phoneNumber, true);
        Logger.end("addAdmin");

        // Notify to restart bot
        await this.bot.sendMessage(
          user.chatId,
          i18n.t("admin_granted_notification")
        );

        // return status OK when isAdin is updated to true
        return res.status(200).json({
          error: false,
          message: "User granted admin privileges",
          username,
          isAdmin: true,
        });
      }
      // catch the unhadlned error during the code
    } catch (error) {
      // if error of type ERROR return the error itself
      if (error instanceof Error) {
        Logger.error("addAdmin", "Could not admin status for the user");
        return res.status(500).json({ error: true, message: error.message });
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
  async updateRequestStatus(req: Request, res: Response) {
    Logger.start("updateRequestStatus");
    try {
      const { phoneNumber } = req.body;
      const user = await UserService.findUserByPhoneNumber(phoneNumber);
      if (!phoneNumber) {
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
        { phoneNumber: phoneNumber, isActive: true },
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
      await this.bot.sendMessage(user.chatId, i18n.t("request_status_update"));
      Logger.end("updatePurchaseRequeset");
      return res.status(200).json({
        error: false,
        message: "The Request status is updated",
        username,
        isActive: false,
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

  // Delete transactions by documentId and agentId
  async removeBonusesTransaction(req: Request, res: Response) {
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

      const transactions = await BonusesTransaction.find(query);

      if (transactions.length === 0) {
        Logger.error("removeTransaction", "No transactions found");
        return res
          .status(404)
          .json({ error: true, message: "No transactions found" });
      }

      // Track user balances that need to be updated
      const userBalances = new Map<string, number>();

      for (const transaction of transactions) {
        // Accumulate the total sum adjustment for each user
        if (!userBalances.has(transaction.userId.toString())) {
          userBalances.set(transaction.userId.toString(), 0);
        }

        const currentAdjustment =
          userBalances.get(transaction.userId.toString()) || 0;
        userBalances.set(
          transaction.userId.toString(),
          currentAdjustment + transaction.sum
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

        user.bonuses = (user.bonuses || 0) - adjustment;
        await user.save();

        // Notify the user
        if (user.chatId) {
          const adjustmentMessage =
            adjustment < 0
              ? `${i18n.t("bonuses_balance_positive_update")} ${Math.abs(
                  adjustment
                )}`
              : `${i18n.t("bonuses_balance_negative_update")} ${adjustment}`;

          await this.bot.sendMessage(user.chatId, adjustmentMessage);
        }
      }

      // Delete all found transactions
      await BonusesTransaction.deleteMany(query);
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
