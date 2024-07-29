import TelegramBot from "node-telegram-bot-api";
import { UserService } from "../services/user.service";

export default class TransactionHandler {
  private bot: TelegramBot;
  private userTransactionPages: Map<number, number> = new Map();

  constructor(bot: TelegramBot) {
    this.bot = bot;
  }

  public async handleListTransactions(msg: TelegramBot.Message) {
    try {
      const chatId = msg.chat.id;
      const transactions = await UserService.getAllTransactions(chatId); // Fetch transactions for the user

      if (transactions.length === 0) {
        this.bot.sendMessage(chatId, "No transactions available.");
        return;
      }

      if (!this.userTransactionPages.has(chatId)) {
        this.userTransactionPages.set(chatId, 1);
      }

      const currentPage = this.userTransactionPages.get(chatId) || 1;
      const itemsPerPage = 5;
      const totalPages = Math.ceil(transactions.length / itemsPerPage);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;

      const transactionPage = transactions
        .slice(startIndex, endIndex)
        .map(
          (transaction: any) =>
            `${transaction.description} | ${transaction.createdAt} | ${transaction.bonuses} Coins\n`
        )
        .join("\n");

      const paginationButtons: TelegramBot.InlineKeyboardButton[] = [];

      if (currentPage > 1) {
        paginationButtons.push({
          text: "Previous",
          callback_data: "transaction_previous_page",
        });
      }

      for (let i = 1; i <= totalPages; i++) {
        paginationButtons.push({
          text: `${i}`,
          callback_data: `transaction_page_${i}`,
        });
      }

      if (currentPage < totalPages) {
        paginationButtons.push({
          text: "Next",
          callback_data: "transaction_next_page",
        });
      }

      await this.bot.sendMessage(
        chatId,
        `*Transactions (Page ${currentPage} of ${totalPages}):*\n\n${transactionPage}`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [paginationButtons],
          },
        }
      );
    } catch (error) {
      console.error("Error fetching transactions:", error);
      this.bot.sendMessage(
        msg.chat.id,
        "There was an error fetching the transaction list. Please try again later."
      );
    }
  }

  public async handlePagination(chatId: number, action: string) {
    if (action === "transaction_previous_page") {
      this.userTransactionPages.set(
        chatId,
        Math.max((this.userTransactionPages.get(chatId) || 1) - 1, 1)
      );
    } else if (action === "transaction_next_page") {
      this.userTransactionPages.set(
        chatId,
        (this.userTransactionPages.get(chatId) || 1) + 1
      );
    } else if (action.startsWith("transaction_page_")) {
      const page = parseInt(action.split("_")[2], 10);
      this.userTransactionPages.set(chatId, page);
    }

    await this.handleListTransactions({
      chat: { id: chatId },
    } as TelegramBot.Message);
  }
}
