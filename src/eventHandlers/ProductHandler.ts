import TelegramBot from "node-telegram-bot-api";
import { UserService } from "../services/user.service";
import i18n from "../utils/i18n";

export default class ProductHandler {
  private bot: TelegramBot;
  private userProductPages: Map<number, number> = new Map();

  constructor(bot: TelegramBot) {
    this.bot = bot;
  }

  public async handleListProducts(msg: TelegramBot.Message) {
    try {
      const chatId = msg.chat.id;
      let products = await UserService.getAllProducts();

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
        .map((product: any) => {
          return `*Name:* ${product.name}\n*Price:* ${product.price} USD`;
        })
        .join("\n\n");

      const paginationButtons: TelegramBot.InlineKeyboardButton[] = [];
      const numPagesToShow = 3; // Number of page buttons to display in each division
      const divisionSize = numPagesToShow * 2 + 1; // Number of pages to display (with ...)

      const startDivision = Math.max(1, Math.floor((currentPage - 1) / numPagesToShow) * numPagesToShow + 1);
      const endDivision = Math.min(totalPages, startDivision + numPagesToShow - 1);

      const showPrev = currentPage > 1;
      const showNext = currentPage < totalPages;

      if (showPrev) {
        paginationButtons.push({
          text: "Prev",
          callback_data: "product_previous_page",
        });
      }

      if (startDivision > 1) {
        paginationButtons.push({
          text: "...",
          callback_data: "product_page_ellipsis",
        });
      }

      for (let i = startDivision; i <= endDivision; i++) {
        paginationButtons.push({
          text: i.toString(),
          callback_data: `product_page_${i}`,
        });
      }

      if (endDivision < totalPages) {
        paginationButtons.push({
          text: "...",
          callback_data: "product_page_ellipsis",
        });
      }

      if (showNext) {
        paginationButtons.push({
          text: "Next",
          callback_data: "product_next_page",
        });
      }

      await this.bot.sendMessage(
        chatId,
        `*Products (Page ${currentPage} of ${totalPages}):*\n\n${productPage}`,
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
    const products = await UserService.getAllProducts();
    const totalPages = Math.ceil(products.length / 5);

    if (action === "product_previous_page") {
      this.userProductPages.set(
        chatId,
        Math.max((this.userProductPages.get(chatId) || 1) - 1, 1)
      );
    } else if (action === "product_next_page") {
      this.userProductPages.set(
        chatId,
        Math.min((this.userProductPages.get(chatId) || 1) + 1, totalPages)
      );
    } else if (action.startsWith("product_page_")) {
      const page = parseInt(action.split("_")[2], 10);
      this.userProductPages.set(chatId, Math.max(1, Math.min(page, totalPages)));
    }

    await this.handleListProducts({
      chat: { id: chatId },
    } as TelegramBot.Message);
  }
}
