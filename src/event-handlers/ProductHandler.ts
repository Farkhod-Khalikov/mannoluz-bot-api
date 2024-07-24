import TelegramBot from "node-telegram-bot-api";
import { UserService } from "../services/UserService";
// import i18n from "../utils/i18n";

export default class ProductHandler {
  private bot: TelegramBot;
  private userProductPages: Map<number, number> = new Map();

  constructor(bot: TelegramBot) {
    this.bot = bot;
  }

  public async handleListProducts(msg: TelegramBot.Message) {
    try {
      const chatId = msg.chat.id;
      const products = await UserService.getAllProducts();

      if (products.length === 0) {
        this.bot.sendMessage(chatId, "No products available.");
        return;
      }

      if (!this.userProductPages.has(chatId)) {
        this.userProductPages.set(chatId, 1);
      }

      const currentPage = this.userProductPages.get(chatId) || 1;
      const itemsPerPage = 5;
      const totalPages = Math.ceil(products.length / itemsPerPage);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;

      const productPage = products
        .slice(startIndex, endIndex)
        .map(
          (product: any) =>
            `*Name:* ${product.name}\n*Price:* ${product.price} UZS`
        )
        .join("\n\n");

      const paginationButtons = [];

      if (currentPage > 1) {
        paginationButtons.push({
          text: "Previous",
          callback_data: "prev_page",
        });
      }

      for (let i = 1; i <= totalPages; i++) {
        paginationButtons.push({ text: `${i}`, callback_data: `page_${i}` });
      }

      if (currentPage < totalPages) {
        paginationButtons.push({ text: "Next", callback_data: "next_page" });
      }

      await this.bot.sendMessage(
        chatId,
        `*Available Products (Page ${currentPage} of ${totalPages}):*\n\n${productPage}`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [paginationButtons],
          },
        }
      );
    } catch (error) {
      console.error("Error fetching products:", error);
      this.bot.sendMessage(
        msg.chat.id,
        "There was an error fetching the product list. Please try again later."
      );
    }
  }

  public async handlePagination(chatId: number, action: string) {
    if (action === "previous") {
      this.userProductPages.set(
        chatId,
        (this.userProductPages.get(chatId) || 1) - 1
      );
    } else if (action === "next") {
      this.userProductPages.set(
        chatId,
        (this.userProductPages.get(chatId) || 1) + 1
      );
    } else if (action.startsWith("page_")) {
      const page = parseInt(action.split("_")[1], 10);
      this.userProductPages.set(chatId, page);
    }

    await this.handleListProducts({
      chat: { id: chatId },
    } as TelegramBot.Message);
  }
}
