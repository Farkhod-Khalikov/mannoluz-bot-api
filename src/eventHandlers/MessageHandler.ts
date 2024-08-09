import TelegramBot from "node-telegram-bot-api";
import UserService from "../services/user.service";
import i18n from "../utils/i18n";
import UserHandler from "./UserHandler";
import TransactionHandler from "./TransactionHandler";
import AdminHandler from "./AdminHandler";
import ProductHandler from "./ProductHandler";
import PurchaseRequestHandler from "./PurchaseRequestHandler";

export default class MessageController {
  private bot: TelegramBot;
  private userHandler: UserHandler;
  private adminHandler: AdminHandler;
  private productHandler: ProductHandler;
  private transactionHandler: TransactionHandler;
  private purchaseRequestHandler: PurchaseRequestHandler;

  constructor(bot: TelegramBot) {
    this.bot = bot;
    this.purchaseRequestHandler = new PurchaseRequestHandler(bot);
    this.userHandler = new UserHandler(bot);
    this.adminHandler = new AdminHandler(bot);
    this.productHandler = new ProductHandler(bot);
    this.transactionHandler = new TransactionHandler(bot);
  }

  public async handleMessage(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const isUserAdmin = await UserService.isUserAdmin(chatId);
    const isExisted = await UserService.isUserRegistered(chatId);

    if (isExisted) {
      const user = await UserService.findUserByChatId(chatId);
      i18n.changeLanguage(user?.language);
    }

    if (msg.text) {
      switch (msg.text) {
        case "/start":
          await this.userHandler.handleStart(msg);
          break;
        case "/userlanguage":
          await this.userHandler.sendUserLanguage(chatId);
          break;
        case i18n.t("purchase_request"):
          await this.userHandler.handlePurchaseRequest(chatId);
          break;
        case i18n.t("btn_list_requests"):
          await this.purchaseRequestHandler.handleListRequests(msg);
          break;
        case i18n.t("btn_rules"):
          await this.bot.sendMessage(chatId, "Rules for using bonuses");
          break;
        case "🇷🇺Русский":
        case "🇺🇸English":
          // change if condition for checking whether user exists in db rather than by newUserLanguguages which is always true
          if (this.userHandler.newUserLanguages.has(chatId)) {
            await this.userHandler.handleLanguageSelection(
              chatId,
              msg.text,
              true
            );
          } /*else {
            await this.userHandler.handleLanguageSelection(
              chatId,
              msg.text,
              false
            );
          }*/
          break;
        case i18n.t("settings_button"):
          await this.userHandler.handleSettings(msg);
          break;
        case i18n.t("btn_list_products"):
          await this.productHandler.handleListProducts(msg);
          break;
        case i18n.t("btn_list_transactions"):
          await this.transactionHandler.handleListTransactions(msg);
          break;
        case i18n.t("change_language_button"):
          await this.userHandler.handleChangeLanguage(msg);
          break;
        case i18n.t("credit_card_button"):
          await this.userHandler.handleMyCreditCard(msg);
          break;
        case i18n.t("contact_us_button"):
          await this.userHandler.handleContactUs(msg);
          break;
        case i18n.t("about_us_button"):
          await this.userHandler.handleAboutUs(msg);
          break;
        case i18n.t("back_button"):
          await this.userHandler.sendMainMenu(chatId);
          break;
        case i18n.t("send_post_button"):
          if (isUserAdmin) {
            await this.adminHandler.handleSendPost(msg);
          }
          break;
        default:
          if (isUserAdmin) {
            // Handle admin-specific messages for post creation
            await this.adminHandler.handleAdminPostData(chatId, msg.text);
          }
        // } else {
        //   this.bot.sendMessage(chatId, i18n.t("command_not_recognized"));
        //   this.userHandler.sendMainMenu(chatId);
        // }
      }
    } else if (msg.photo) {
      // Handle image uploads
      await this.adminHandler.handleImageUpload(msg);
    }
  }
  public async handleCallbackQuery(callbackQuery: TelegramBot.CallbackQuery) {
    const chatId = callbackQuery.message?.chat.id;
    const data = callbackQuery.data;

    if (chatId && data) {
      if (data.startsWith("transaction_page_")) {
        const page = parseInt(data.split("_")[2], 10);
        await this.transactionHandler.handlePagination(
          chatId,
          `transaction_page_${page}`
        );
      } else if (data.startsWith("product_page_")) {
        const page = parseInt(data.split("_")[2], 10);
        await this.productHandler.handlePagination(
          chatId,
          `product_page_${page}`
        );
      } else if (data.startsWith("request_page_")) {
        const page = parseInt(data.split("_")[2], 10);
        await this.purchaseRequestHandler.handlePagination(
          chatId,
          `request_page_${page}`
        );
      } else {
        switch (data) {
          case "confirm_purchase_request":
            await this.userHandler.handleConfirmPurchaseRequest(chatId);
            break;
          case "cancel_purchase_request":
            await this.userHandler.handleCancelPurchaseRequest(chatId);
            break;
          case "confirm_post":
            await this.adminHandler.handleConfirmPost(chatId);
            break;
          case "cancel_post":
            await this.adminHandler.handleCancelPost(chatId);
            break;
          case "transaction_previous_page":
            await this.transactionHandler.handlePagination(
              chatId,
              "transaction_previous_page"
            );
            break;
          case "transaction_next_page":
            await this.transactionHandler.handlePagination(
              chatId,
              "transaction_next_page"
            );
            break;
          case "product_previous_page":
            await this.productHandler.handlePagination(
              chatId,
              "product_previous_page"
            );
            break;
          case "request_next_page":
            await this.purchaseRequestHandler.handlePagination(
              chatId,
              "request_next_page"
            );
            break;
          case "request_previous_page":
            await this.purchaseRequestHandler.handlePagination(
              chatId,
              "request_previous_page"
            );
            break;
          case "product_next_page":
            await this.productHandler.handlePagination(
              chatId,
              "product_next_page"
            );
            break;
          default:
            console.warn(`Unknown callback query data: ${data}`);
        }
      }

      // Acknowledge the callback query to remove the "loading" state from the button
      await this.bot.answerCallbackQuery(callbackQuery.id);
    }
  }
}
