import { PurchaseRequest } from '../models/purchase-requests.schema';
import BonusesTransaction, { ITransaction } from '../models/bonuses-transactions.schema';
import User, { IUser } from '../models/users.schema';
import MoneyTransaction from '../models/money-transactions.schema';

export default class UserService {
  // update user's balance history by deleted transaction
  public static async updateBonusesBalance(userId: string): Promise<number> {
    // Fetch the user by ID
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Fetch all transactions for the user with type "bonuses"
    const bonusTransactions = await BonusesTransaction.find({
      userId: userId,
      transactionType: 'bonuses',
    });

    // Calculate the total bonuses from transactions
    let countedBonuses = 0;
    for (const transaction of bonusTransactions) {
      countedBonuses += transaction.sum; // Add sum directly; negative sums will subtract
    }

    // Update user's bonuses balance in the database
    user.bonuses = countedBonuses;
    await user.save();
    return user.bonuses;
  }
  public static async updateMoneyBalance(userId: string) {
    // Fetch the user by ID
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Fetch all transactions for the user
    const transactions = await this.getAllTransactions(userId);

    // Calculate the new balance based on money transactions only
    let countedSum = 0;
    for (const transaction of transactions) {
      if (transaction.transactionType === 'money') {
        // Check for money transaction type
        countedSum += transaction.sum; // Add sum directly; negative sums will subtract
      }
    }
    // Update user's money balance in the database
    user.money = countedSum;
    await user.save();
    return user.money;
  }

  public static async applyDeletionBalanceAdjustment(userId: string, transactions: ITransaction[]) {
    // Calculate the total adjustment for the user
    const totalAdjustment = transactions.reduce((sum, transaction) => sum + transaction.sum, 0);

    // Update each transaction's subsequent records based on the deleted sum
    const lastTransactionTime = transactions[transactions.length - 1].createdAt;
    const subsequentTransactions = await MoneyTransaction.find({
      userId,
      createdAt: { $gt: lastTransactionTime },
    });

    for (const transaction of subsequentTransactions) {
      transaction.oldBalance -= totalAdjustment;
      transaction.newBalance -= totalAdjustment;
      await transaction.save();
    }

    // Adjust user balance
    const user = await User.findById(userId);
    if (user) {
      user.money = (user.money || 0) - totalAdjustment;
      await user.save();
    }

    // Return total adjustment for logging or further processing if needed
    return totalAdjustment;
  }

  public static async applyBalanceAdjustment(
    userId: string,
    existingTransaction: ITransaction,
    correctedSum: number,
    isPositiveCorrection: boolean
  ) {
    // Calculate the adjustment amount
    const adjustment = isPositiveCorrection
      ? correctedSum - existingTransaction.sum
      : correctedSum - Math.abs(existingTransaction.sum);

    // Determine new balance based on the correction type
    existingTransaction.sum = isPositiveCorrection ? correctedSum : -correctedSum;
    existingTransaction.newBalance = isPositiveCorrection
      ? existingTransaction.oldBalance + correctedSum
      : existingTransaction.oldBalance - correctedSum;

    // Save the corrected transaction
    await existingTransaction.save();

    // Adjust all subsequent transactions by the adjustment amount
    const subsequentTransactions = await MoneyTransaction.find({
      userId,
      createdAt: { $gt: existingTransaction.createdAt },
    });

    for (const transaction of subsequentTransactions) {
      transaction.oldBalance += isPositiveCorrection ? adjustment : -adjustment;
      transaction.newBalance += isPositiveCorrection ? adjustment : -adjustment;
      await transaction.save();
    }

    // Update the user balance
    await UserService.updateMoneyBalance(userId);
  }
  public static async findUserByChatId(chatId: number): Promise<IUser | null> {
    return User.findOne({ chatId });
  }

  public static async findUserByPhoneNumber(phoneNumber: string): Promise<IUser | null> {
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
  public static async hasActiveRequests(phoneNumber: string): Promise<boolean> {
    return (await BonusesTransaction.find({ isActive: true, phone: phoneNumber })) ? true : false;
  }

  // user could not creat /
  static async updateUserSudoStatus(
    phoneNumber: string,
    isSudo: boolean
  ): Promise<boolean | void | null> {
    try {
      const user = await this.findUserByPhoneNumber(phoneNumber);
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
      const user = await this.findUserByPhoneNumber(phoneNumber);
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
