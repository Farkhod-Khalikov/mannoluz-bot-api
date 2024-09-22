import { PurchaseRequest } from '../models/purchase-requests.schema';
import BonusesTransaction from '../models/bonuses-transactions.schema';
import User, { IUser } from '../models/users.schema';
import MoneyTransaction from '../models/money-transactions.schema';

export default class UserService {
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
    const bonusesTransactions =  await BonusesTransaction.find({userId: userId});
    const moneyTransactions = await MoneyTransaction.find({userId: userId});
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
