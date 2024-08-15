import Transaction from "../models/transactions.schema";

export default class TransactionService {
  public static async createTransacton(
    uniqueId: string,
    userId: string,
    bonuses: number,
    description: string
  ) {
    try {
        //try to create transacton
    } catch (error) {
        // catch the error -> log it -> return
    }
  }
  public static async findTransactionByUniqueId(uniqueId: string) {
    return Transaction.findOne({ uniqueId: uniqueId });
  }
  public static async deleteTransactionByUniqueId(uniqueId: string){

  }
  public static async isDuplicated(uniqueId: string) {
    const transaction = await this.findTransactionByUniqueId(uniqueId);
    if (!transaction) return false;
    else true;
  }
}
