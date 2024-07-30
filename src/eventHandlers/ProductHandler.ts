import TelegramBot from "node-telegram-bot-api";
import { UserService } from "../services/user.service";

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
            `*Name:* ${product.name}\n*Price:* ${product.price} USD`
        )
        .join("\n\n");

      const paginationButtons: TelegramBot.InlineKeyboardButton[] = [];

      if (currentPage > 1) {
        paginationButtons.push({
          text: "Previous",
          callback_data: "product_previous_page",
        });
      }

      for (let i = 1; i <= totalPages; i++) {
        paginationButtons.push({
          text: `${i}`,
          callback_data: `product_page_${i}`,
        });
      }

      if (currentPage < totalPages) {
        paginationButtons.push({
          text: "Next",
          callback_data: "product_next_page",
        });
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
    if (action === "product_previous_page") {
      this.userProductPages.set(
        chatId,
        Math.max((this.userProductPages.get(chatId) || 1) - 1, 1)
      );
    } else if (action === "product_next_page") {
      this.userProductPages.set(
        chatId,
        (this.userProductPages.get(chatId) || 1) + 1
      );
    } else if (action.startsWith("product_page_")) {
      const page = parseInt(action.split("_")[2], 10);
      this.userProductPages.set(chatId, page);
    }

    await this.handleListProducts({
      chat: { id: chatId },
    } as TelegramBot.Message);
  }
}
