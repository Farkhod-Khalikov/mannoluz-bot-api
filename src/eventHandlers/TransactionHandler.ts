import TelegramBot from "node-telegram-bot-api";
import { UserService } from "../services/user.service";
import i18n from "../utils/i18n";

export default class TransactionHandler {
  private bot: TelegramBot;
  private userTransactionPages: Map<number, number> = new Map();

  constructor(bot: TelegramBot) {
    this.bot = bot;
  }

  public async handleListTransactions(msg: TelegramBot.Message) {
    try {
      const chatId = msg.chat.id;
      let transactions = await UserService.getAllTransactions(chatId);

      if (transactions.length === 0) {
        this.bot.sendMessage(chatId, "No transactions available.");
        return;
      }

      transactions = transactions.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

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
        .map((transaction: any) => {
          const date = new Date(transaction.createdAt);
          const formattedDate = `${date
            .getDate()
            .toString()
            .padStart(2, "0")}.${(date.getMonth() + 1)
            .toString()
            .padStart(2, "0")}.${date.getFullYear()}`;
          return `${
            transaction.bonuses > 0
              ? i18n.t("bonuses_addition").padEnd(10, " ")
              : i18n.t("bonuses_removal").padEnd(10, " ")
          } | ${formattedDate} | ${transaction.bonuses} ${i18n.t("coins")}\n`;
        })
        .join("\n");

      const paginationButtons: TelegramBot.InlineKeyboardButton[] = [];
      const numPagesToShow = 3;
      const divisionSize = numPagesToShow * 2 + 1;

      const startDivision = Math.max(1, Math.floor((currentPage - 1) / numPagesToShow) * numPagesToShow + 1);
      const endDivision = Math.min(totalPages, startDivision + numPagesToShow - 1);


      if (startDivision > 1) {
        paginationButtons.push({
          text: "...",
          callback_data: "transaction_page_ellipsis",
        });
      }

      for (let i = startDivision; i <= endDivision; i++) {
        paginationButtons.push({
          text: i.toString(),
          callback_data: `transaction_page_${i}`,
        });
      }

      if (endDivision < totalPages) {
        paginationButtons.push({
          text: "...",
          callback_data: "transaction_page_ellipsis",
        });
      }

      const row1 = paginationButtons;

      const row2: TelegramBot.InlineKeyboardButton[] = [];

      if (currentPage > 1) {
        row2.push({
          text: "Prev",
          callback_data: "transaction_previous_page",
        });
      }

      if (currentPage < totalPages) {
        row2.push({
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
            inline_keyboard: [row1, row2],
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
    const transactions = await UserService.getAllTransactions(chatId);
    const totalPages = Math.ceil(transactions.length / 5);

    if (action === "transaction_previous_page") {
      this.userTransactionPages.set(
        chatId,
        Math.max((this.userTransactionPages.get(chatId) || 1) - 1, 1)
      );
    } else if (action === "transaction_next_page") {
      this.userTransactionPages.set(
        chatId,
        Math.min((this.userTransactionPages.get(chatId) || 1) + 1, totalPages)
      );
    } else if (action.startsWith("transaction_page_")) {
      const page = parseInt(action.split("_")[2], 10);
      this.userTransactionPages.set(chatId, Math.max(1, Math.min(page, totalPages)));
    }

    await this.handleListTransactions({
      chat: { id: chatId },
    } as TelegramBot.Message);
  }
}
