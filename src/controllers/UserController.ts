import TelegramBot from "node-telegram-bot-api";
import i18n from "../utils/i18n";

export default class UserController {
  private bot: TelegramBot;
  constructor(bot: TelegramBot) {
    this.bot = bot;
  }
  private async handleChangeLanguage(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const keyboard = [[{ text: "🇷🇺Русский" }, { text: "🇺🇸English" }]];
    this.bot.sendMessage(chatId, i18n.t("choose_language"), {
      reply_markup: {
        keyboard: keyboard,
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
  }
}
