import BonusesTransaction from '../models/bonuses-transactions.schema';

export default class TransactionService {
  public static async findTransactionByUniqueId(uniqueId: string) {
    return BonusesTransaction.findOne({ uniqueId: uniqueId });
  }

  // public static async deleteTransactionByUniqueId(uniqueId: string) {}

  public static async isDuplicated(uniqueId: string) {
    const transaction = await this.findTransactionByUniqueId(uniqueId);
    if (!transaction) return false;
    else return true;
  }
}
