import { PurchaseRequest } from '../models/purchase-requests.schema';
import BonusesTransaction, { ITransaction } from '../models/bonuses-transactions.schema';
import User, { IUser } from '../models/users.schema';
import MoneyTransaction from '../models/money-transactions.schema';

export default class UserService {
  // update user's balance history by deleted transaction
  private async updateBalanceHistoryByDeletion(
    userId: string,
    adjustment: number,
    deletedTransaction: any
  ) {}

  public static async updateBalance(userId: string) {
    // Fetch the user by ID
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Fetch all transactions for the user
    const transactions = await this.getAllTransactions(userId);

    // Calculate the new balance based on transactions
    let countedSum = 0;
    for (const transaction of transactions) {
      countedSum += transaction.sum; // Add sum directly; negative sums will subtract
    }

    // Update user's balance in the database
    user.money = countedSum;
    await user.save();
    return user.money;
  }

  public static async updateBalanceHistoryByNegativeCorrection(
    userId: string,
    existingTransaction: ITransaction,
    correctedSum: number
  ) {
    // correctedSum = 100, abs(currentSum) = 50,
    // adjustment = currectedSum - currentSum = 50 (removal)
    const adjustment = correctedSum - Math.abs(existingTransaction.sum);

    if (adjustment > 0) {
      // removal
      existingTransaction.sum = -correctedSum;
      existingTransaction.newBalance = existingTransaction.oldBalance - correctedSum;
      await existingTransaction.save();

      const subsequentTransactions = await MoneyTransaction.find({
        userId,
        createdAt: { $gt: existingTransaction.createdAt },
      });

      for (const transaction of subsequentTransactions) {
        // console.log(`oldBalance: ${transaction.oldBalance} - adjustment: ${Math.abs(adjustment)}`);
        transaction.oldBalance -= adjustment;
        // console.log(`Result: ${transaction.oldBalance}`);
        transaction.newBalance -= adjustment;

        await transaction.save();
      }
      // find user to update user balance
      await UserService.updateBalance(userId);
    } else if (adjustment < 0) {
      existingTransaction.sum = -correctedSum;
      existingTransaction.newBalance = existingTransaction.oldBalance - correctedSum; // Adjust the newBalance

      // Save the corrected transaction
      await existingTransaction.save();

      // Adjust all subsequent transactions by the difference
      const subsequentTransactions = await MoneyTransaction.find({
        userId,
        createdAt: { $gt: existingTransaction.createdAt },
      });
      // if (adjustment > 0) addition
      for (const transaction of subsequentTransactions) {
        transaction.oldBalance += Math.abs(adjustment);
        transaction.newBalance += Math.abs(adjustment);
        await transaction.save();
      }
      await UserService.updateBalance(userId);
    }
  }

  // Correct all the transactions by corrected transactions
  public static async updateBalanceHistoryByPositiveCorrection(
    userId: string,
    existingTransaction: ITransaction,
    correctedSum: number
  ) {
    // Calculate the difference between the existing sum and the corrected sum
    const adjustment = correctedSum - existingTransaction.sum;

    // newSum - currentSum = result is negative is newSum is less the currentSum which means that
    // balance history should be decreased by adjustment same as user's balance
    if (adjustment < 0) {
      existingTransaction.sum = correctedSum;
      existingTransaction.newBalance = existingTransaction.oldBalance + correctedSum;
      await existingTransaction.save();

      const subsequentTransactions = await MoneyTransaction.find({
        userId,
        createdAt: { $gt: existingTransaction.createdAt },
      });

      for (const transaction of subsequentTransactions) {
        // console.log(`oldBalance: ${transaction.oldBalance} - adjustment: ${Math.abs(adjustment)}`);
        transaction.oldBalance -= Math.abs(adjustment);
        // console.log(`Result: ${transaction.oldBalance}`);
        transaction.newBalance -= Math.abs(adjustment);

        await transaction.save();
      }
      await UserService.updateBalance(userId);
    } else if (adjustment > 0) {
      existingTransaction.sum = correctedSum;
      existingTransaction.newBalance = existingTransaction.oldBalance + correctedSum; // Adjust the newBalance

      // Save the corrected transaction
      await existingTransaction.save();

      // Adjust all subsequent transactions by the difference
      const subsequentTransactions = await MoneyTransaction.find({
        userId,
        createdAt: { $gt: existingTransaction.createdAt },
      });
      // if (adjustment > 0) addition
      for (const transaction of subsequentTransactions) {
        transaction.oldBalance += Math.abs(adjustment);
        transaction.newBalance += Math.abs(adjustment);
        await transaction.save();
      }

      await UserService.updateBalance(userId);
    }
  }

  public static async findUserByChatId(chatId: number): Promise<IUser | null> {
    return User.findOne({ chatId });
  }

  public static async findUserByphoneNumber(phoneNumber: string): Promise<IUser | null> {
    return User.findOne({ phone: phoneNumber });
  }

  public static async getUserName(chatId: number): Promise<string> {
    try {
      // Fetch the user based on the chatId
      const user = await User.findOne({ chatId }).exec();

      if (!user) {
        throw new Error('User not found');
      }

      // Return the user's name (assuming your User model has a name field)
      return user.name || 'Unknown User'; // Adjust as necessary
    } catch (error) {
      console.error('Error fetching user name:', error);
      return 'Unknown User';
    }
  }

  public static async getUserLanguage(chatId: number) {
    const user = await this.findUserByChatId(chatId);
    if (user) {
      return user.language;
    }
    throw new Error('user is not found');
  }

  public static async createPurchaseRequest(
    chatId: number,
    name: string,
    phone: string,
    comment: string,
    isActive: boolean
  ) {
    const purchaseRequest = new PurchaseRequest({
      chatId,
      name,
      phone,
      comment,
      isActive, // by default currently true
    });

    await purchaseRequest.save();
  }

  public static async createUser(
    chatId: number,
    name: string,
    phone: string,
    language: string
  ): Promise<void> {
    const user = new User({
      chatId,
      name,
      phone,
      language,
    });
    user.createdAt = new Date();
    await user.save();
  }

  public static async isUserAdmin(chatId: number): Promise<boolean> {
    const user = await User.findOne({ chatId });
    return user?.isAdmin ? true : false;
  }

  public static async isUserRegistered(chatId: number): Promise<boolean> {
    return (await User.findOne({ chatId })) ? true : false;
  }

  public static async getAllUsers(): Promise<IUser[]> {
    return User.find({});
  }

  //by userId which is saved in transaction schema
  public static async getAllTransactions(userId: string) {
    const bonusesTransactions = await BonusesTransaction.find({ userId: userId });
    const moneyTransactions = await MoneyTransaction.find({ userId: userId });
    return [...bonusesTransactions, ...moneyTransactions];
  }

  public static async getAllAdmins(): Promise<IUser[]> {
    return User.find({ isAdmin: true });
  }

  // use it to check before sending a new request
  public static async hasActiveRequests(phoneNumber: string) {
    return (await BonusesTransaction.find({ isActive: true, phone: phoneNumber })) ? true : false;
  }

  // user could not creat /
  static async updateUserSudoStatus(phoneNumber: string, isSudo: boolean) {
    try {
      const user = await this.findUserByphoneNumber(phoneNumber);
      if (!user) {
        throw new Error('User not found');
      }
      await user.updateOne({ $set: { isSudo } });
    } catch (error) {
      console.error('Error updating admin status:', error);
      throw new Error('Error updating admin status');
    }
  }

  static async updateUserAdminStatus(phoneNumber: string, isAdmin: boolean) {
    try {
      const user = await this.findUserByphoneNumber(phoneNumber);
      if (!user) {
        throw new Error('User not found');
      }
      await user.updateOne({ $set: { isAdmin } });
    } catch (error) {
      console.error('Error updating admin status:', error);
      throw new Error('Error updating admin status');
    }
  }
}
