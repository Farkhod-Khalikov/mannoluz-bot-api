import TelegramBot from "node-telegram-bot-api";
import { UserService } from "../services/user.service";
import i18n from "../utils/i18n";
import UserHandler from "./UserHandler";
import AdminHandler from "./AdminHandler";
import ProductHandler from "./ProductHandler";

export default class MessageController {
  private bot: TelegramBot;
  private userHandler: UserHandler;
  private adminHandler: AdminHandler;
  private productHandler: ProductHandler;

  constructor(bot: TelegramBot) {
    this.bot = bot;
    this.userHandler = new UserHandler(bot);
    this.adminHandler = new AdminHandler(bot);
    this.productHandler = new ProductHandler(bot);
  }

  public async handleMessage(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const isUserAdmin = await UserService.isUserAdmin(chatId);

    if (msg.text) {
      switch (msg.text) {
        case "/start":
          await this.userHandler.handleStart(msg);
          break;
        case "🇷🇺Русский":
        case "🇺🇸English":
          if (this.userHandler.newUserLanguages.has(chatId)) {
            await this.userHandler.handleLanguageSelection(chatId, msg.text, true);
          } else {
            await this.userHandler.handleLanguageSelection(chatId, msg.text, false);
          }
          break;
        case i18n.t("settings_button"):
          await this.userHandler.handleSettings(msg);
          break;
        case i18n.t("btn_list_products"):
          await this.productHandler.handleListProducts(msg);
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
          } else {
            this.bot.sendMessage(chatId, i18n.t("command_not_recognized"));
            this.userHandler.sendMainMenu(chatId);
          }
      }
    } else if (msg.photo) {
      // Handle image uploads
      await this.adminHandler.handleImageUpload(msg);
    }
  }

  public async handleCallbackQuery(callbackQuery: TelegramBot.CallbackQuery) {
    const chatId = callbackQuery.message?.chat.id;
    const data = callbackQuery.data;

    if (chatId) {
      switch (data) {
        case "confirm_post":
          await this.adminHandler.handleConfirmPost(chatId);
          break;
        case "cancel_post":
          await this.adminHandler.handleCancelPost(chatId);
          break;
        case "prev_page":
          await this.productHandler.handlePagination(chatId, "previous");
          break;
        case "next_page":
          await this.productHandler.handlePagination(chatId, "next");
          break;
        default:
          if (data?.startsWith("page_")) {
            const page = parseInt(data.split("_")[1], 10);
            this.productHandler.handlePagination(chatId, `page_${page}`);
          }
      }
    }
  }
}
