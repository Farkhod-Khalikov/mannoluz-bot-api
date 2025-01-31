import TelegramBot from "node-telegram-bot-api";
import ProductService from "../services/product.service";
import i18n from "../utils/i18n";

class ProductHandler {
  private bot: TelegramBot;
  private userProductPages: Map<number, number> = new Map();

  constructor(bot: TelegramBot) {
    this.bot = bot;
  }

  public async handleListProducts(msg: TelegramBot.Message) {
    try {
      const chatId = msg.chat.id;
      this.resetProductPage(chatId);
      await this.showProducts(chatId);
    } catch (error) {
      console.error("Error fetching products:", error);
      this.bot.sendMessage(msg.chat.id, i18n.t("error_fetching_products"));
    }
  }

  // Reset to first page when user clicks on button
  private resetProductPage(chatId: number) {
    this.userProductPages.set(chatId, 1);
  }

  private async showProducts(chatId: number) {
    let products = await ProductService.getAllProducts();

    if (products.length === 0) {
      this.bot.sendMessage(chatId, i18n.t("products_not_found"));
      return;
    }

    // sort by date added (created)
    products = products.sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const currentPage = this.userProductPages.get(chatId) || 1;
    const itemsPerPage = 5;
    const totalPages = Math.ceil(products.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    const productPage = products
      .slice(startIndex, endIndex)
      .map(
        (product: any) =>
          `*${i18n.t("product")}:* ${product.name}\n*${i18n.t("price")}:* ${product.price} ${i18n.t(
            "coins",
          )}`,
      )
      .join("\n\n");

    const paginationButtons: TelegramBot.InlineKeyboardButton[] = [];
    const numPagesToShow = 3; // Number of page buttons to display in each division

    const startDivision = Math.max(
      1,
      Math.floor((currentPage - 1) / numPagesToShow) * numPagesToShow + 1,
    );
    const endDivision = Math.min(totalPages, startDivision + numPagesToShow - 1);

    const showPrev = currentPage > 1;
    const showNext = currentPage < totalPages;

    // Add ellipsis before page numbers if applicable
    if (startDivision > 1) {
      paginationButtons.push({
        text: "...",
        callback_data: "product_ellipsis_prev",
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
        callback_data: "product_ellipsis_next",
      });
    }

    // Arrange buttons in separate lines
    const keyboard: TelegramBot.InlineKeyboardButton[][] = [];

    // Page buttons
    if (paginationButtons.length > 0) {
      keyboard.push(paginationButtons);
    }

    const navigationButtons: TelegramBot.InlineKeyboardButton[] = [];
    if (showPrev) {
      navigationButtons.push({
        text: i18n.t("prev"),
        callback_data: "product_previous_page",
      });
    }
    if (showNext) {
      navigationButtons.push({
        text: i18n.t("next"),
        callback_data: "product_next_page",
      });
    }
    if (navigationButtons.length > 0) {
      keyboard.push(navigationButtons);
    }

    await this.bot.sendMessage(
      chatId,
      `🛒*${i18n.t("products")} (${currentPage} ${i18n.t("of")} ${totalPages})*\n\n${productPage}`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: keyboard,
        },
      },
    );
  }

  public async handlePagination(chatId: number, action: string) {
    const products = await ProductService.getAllProducts();
    const totalPages = Math.ceil(products.length / 5);
    const currentPage = this.userProductPages.get(chatId) || 1;
    const numPagesToShow = 3;

    if (action.startsWith("product_page_")) {
      const page = parseInt(action.split("_")[2], 10);
      this.userProductPages.set(chatId, Math.max(1, Math.min(page, totalPages)));
    } else if (action === "product_previous_page") {
      this.userProductPages.set(chatId, Math.max((this.userProductPages.get(chatId) || 1) - 1, 1));
    } else if (action === "product_next_page") {
      this.userProductPages.set(
        chatId,
        Math.min((this.userProductPages.get(chatId) || 1) + 1, totalPages),
      );
    } else if (action === "product_ellipsis_prev") {
      const startDivision = Math.max(
        1,
        Math.floor((currentPage - 1) / numPagesToShow) * numPagesToShow + 1,
      );
      const newStartPage = Math.min(totalPages, startDivision - numPagesToShow);
      this.userProductPages.set(chatId, newStartPage);
    } else if (action === "product_ellipsis_next") {
      const newStartPage = Math.min(totalPages, currentPage + numPagesToShow);
      this.userProductPages.set(chatId, newStartPage);
    }
    await this.showProducts(chatId);
  }
}

export default ProductHandler;
