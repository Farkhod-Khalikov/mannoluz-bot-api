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
      this.resetProductPage(chatId); // Reset the current page to 1
      await this.showProducts(chatId);
    } catch (error) {
      console.error("Error fetching products:", error);
      this.bot.sendMessage(
        msg.chat.id,
        "There was an error fetching the product list. Please try again later."
      );
    }
  }

  private async showProducts(chatId: number) {
    const products = await UserService.getAllProducts();

    if (products.length === 0) {
      this.bot.sendMessage(chatId, "No products available.");
      return;
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
          `*Product Name:* ${product.name}\n*Price:* ${product.price} ${i18n.t(
            "coins"
          )}`
      )
      .join("\n\n");

    const paginationButtons: TelegramBot.InlineKeyboardButton[] = [];
    const numPagesToShow = 3; // Number of page buttons to display in each division

    const startDivision = Math.max(
      1,
      Math.floor((currentPage - 1) / numPagesToShow) * numPagesToShow + 1
    );
    const endDivision = Math.min(
      totalPages,
      startDivision + numPagesToShow - 1
    );

    const showPrev = currentPage > 1;
    const showNext = currentPage < totalPages;

    if (startDivision > 1) {
      paginationButtons.push({
        text: "...",
        callback_data: "product_page_ellipsis",
      });
    }

    for (let i = startDivision; i <= endDivision; i++) {
      paginationButtons.push({
        text: i === currentPage ? `${i} ✅` : i.toString(),
        callback_data: `product_page_${i}`,
      });
    }

    if (endDivision < totalPages) {
      paginationButtons.push({
        text: "...",
        callback_data: "product_page_ellipsis",
      });
    }

    // Arrange buttons in separate lines
    const keyboard: TelegramBot.InlineKeyboardButton[][] = [];

    // Page buttons
    if (paginationButtons.length > 0) {
      keyboard.push(paginationButtons);
    }

    // Prev and Next buttons
    const navButtons: TelegramBot.InlineKeyboardButton[] = [];
    if (showPrev) {
      navButtons.push({
        text: i18n.t("prev"),
        callback_data: "product_previous_page",
      });
    }
    if (showNext) {
      navButtons.push({
        text: i18n.t("next"),
        callback_data: "product_next_page",
      });
    }

    if (navButtons.length > 0) {
      keyboard.push(navButtons);
    }

    await this.bot.sendMessage(
      chatId,
      `*Available Products (Page ${currentPage} of ${totalPages}):*\n\n${productPage}`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: keyboard,
        },
      }
    );
  }

  private resetProductPage(chatId: number) {
    this.userProductPages.set(chatId, 1);
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
      this.userProductPages.set(
        chatId,
        Math.max(1, Math.min(page, totalPages))
      );
    }

    await this.showProducts(chatId);
  }
}
