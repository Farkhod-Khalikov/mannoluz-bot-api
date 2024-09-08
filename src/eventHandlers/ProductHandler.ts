import TelegramBot from "node-telegram-bot-api";
import ProductService from "../services/product.service";
import i18n from "../utils/i18n";

class ProductHandler {
  private bot: TelegramBot;
  private userProductPages: Map<number, number>;

  constructor(bot: TelegramBot) {
    this.bot = bot;
    this.userProductPages = new Map();
  }

  public async handleListProducts(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    // Initialize the user's page to 1 before displaying the products
    this.userProductPages.set(chatId, 1);
    await this.showProducts(chatId);
  }

  private async showProducts(chatId: number) {
    const products = await ProductService.getAllProducts();

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
          `*Product:* ${product.name}\n*Price:* ${product.price} ${i18n.t(
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

    // Add ellipsis before page numbers if applicable
    if (startDivision > 1) {
      paginationButtons.push({
        text: "...",
        callback_data: "product_page_ellipsis_prev",
      });
    }

    // Add the page numbers
    for (let i = startDivision; i <= endDivision; i++) {
      paginationButtons.push({
        text: i === currentPage ? `${i} ✅` : i.toString(),
        callback_data: `product_page_${i}`,
      });
    }

    // Add ellipsis after page numbers if applicable
    if (endDivision < totalPages) {
      paginationButtons.push({
        text: "...",
        callback_data: "product_page_ellipsis_next",
      });
    }

    // Arrange buttons in separate lines
    const keyboard: TelegramBot.InlineKeyboardButton[][] = [];

    // Page buttons
    if (paginationButtons.length > 0) {
      keyboard.push(paginationButtons);
    }

    // Prev and Next buttons
    if (showPrev || showNext) {
      const navigationButtons: TelegramBot.InlineKeyboardButton[] = [];
      if (showPrev) {
        navigationButtons.push({
          text: "Prev",
          callback_data: "product_previous_page",
        });
      }
      if (showNext) {
        navigationButtons.push({
          text: "Next",
          callback_data: "product_next_page",
        });
      }
      keyboard.push(navigationButtons);
    }

    await this.bot.sendMessage(chatId, productPage, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: keyboard,
      },
    });
  }

  public async handlePagination(chatId: number, callbackData: string) {
    if (callbackData.startsWith("product_page_")) {
      const page = parseInt(callbackData.split("_")[2], 10);
      this.userProductPages.set(chatId, page);
      await this.showProducts(chatId);
    } else if (callbackData === "product_previous_page") {
      const currentPage = this.userProductPages.get(chatId) || 1;
      if (currentPage > 1) {
        this.userProductPages.set(chatId, currentPage - 1);
        await this.showProducts(chatId);
      }
    } else if (callbackData === "product_next_page") {
      const currentPage = this.userProductPages.get(chatId) || 1;
      const totalPages = await ProductService.getTotalPages(); // You need to implement this method
      if (currentPage < totalPages) {
        this.userProductPages.set(chatId, currentPage + 1);
        await this.showProducts(chatId);
      }
    } else if (callbackData === "product_page_ellipsis_prev") {
      const currentPage = this.userProductPages.get(chatId) || 1;
      const newPage = Math.max(1, currentPage - 3); // Adjust as needed
      this.userProductPages.set(chatId, newPage);
      await this.showProducts(chatId);
    } else if (callbackData === "product_page_ellipsis_next") {
      const currentPage = this.userProductPages.get(chatId) || 1;
      const totalPages = await ProductService.getTotalPages(); // You need to implement this method
      const newPage = Math.min(totalPages, currentPage + 3); // Adjust as needed
      this.userProductPages.set(chatId, newPage);
      await this.showProducts(chatId);
    }
  }
}

export default ProductHandler;
