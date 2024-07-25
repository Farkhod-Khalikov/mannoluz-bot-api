import Product, { IProduct } from "../models/products.schema";
import User, { IUser } from "../models/users.schema";

export class UserService {
  public static async findUserByChatId(chatId: number): Promise<IUser | null> {
    return User.findOne({ chatId });
  }

  public static async findUserByPhoneNumber(
    phoneNumber: string
  ): Promise<IUser | null> {
    return User.findOne({ phone: phoneNumber });
  }
  public static async getAdminName(chatId: number): Promise<string> {
    try {
      // Fetch the user based on the chatId
      const user = await User.findOne({ chatId }).exec();

      if (!user) {
        throw new Error("User not found");
      }

      // Return the user's name (assuming your User model has a name field)
      return user.name || "Unknown Admin"; // Adjust as necessary
    } catch (error) {
      console.error("Error fetching admin name:", error);
      return "Unknown Admin";
    }
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

  public static async setAdmin(
    chatId: number,
    isAdmin: boolean
  ): Promise<void> {
    const user = await User.findOne({ chatId });
    if (user) {
      user.isAdmin = isAdmin;
      await user.save();
    }
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
  public static async getAllProducts(): Promise<IProduct[]> {
    return Product.find({});
  }
}
