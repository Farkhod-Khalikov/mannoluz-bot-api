import TelegramBot from "node-telegram-bot-api";
import { UserService } from "../services/UserService";
import i18n from "../utils/i18n";

export default class AdminHandler {
  private bot: TelegramBot;
  private adminPostData: Map<
    number,
    { title: string | null; message: string | null }
  > = new Map();

  constructor(bot: TelegramBot) {
    this.bot = bot;
  }

  public async handleSendPost(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;

    this.bot.sendMessage(chatId, i18n.t("provide_post_title"), {
      reply_markup: {
        force_reply: true,
      },
    });

    this.adminPostData.set(chatId, { title: null, message: null });
  }

  public async handleAdminPostData(chatId: number, text: string) {
    const currentPostData = this.adminPostData.get(chatId);

    if (currentPostData) {
      if (!currentPostData.title) {
        currentPostData.title = text;
        this.bot.sendMessage(chatId, i18n.t("provide_post_message"), {
          reply_markup: {
            force_reply: true,
          },
        });
      } else if (!currentPostData.message) {
        currentPostData.message = text;
        const postSummary = `
*Title:* ${currentPostData.title}

*Message:* ${currentPostData.message}
        `;
        this.bot.sendMessage(chatId, postSummary, {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: i18n.t("confirm_button"),
                  callback_data: "confirm_post",
                },
              ],
              [
                {
                  text: i18n.t("btn_cancel_post_creation"),
                  callback_data: "cancel_post",
                },
              ],
            ],
          },
        });
      }
    }
  }

  public async handleConfirmPost(chatId: number) {
    const postData = this.adminPostData.get(chatId);
    if (postData && postData.title && postData.message) {
      const users = await UserService.getAllUsers();
      for (const user of users) {
        this.bot.sendMessage(
          user.chatId,
          `*${postData.title}*\n\n${postData.message}`,
          {
            parse_mode: "Markdown",
          }
        );
      }
      this.bot.sendMessage(chatId, i18n.t("post_sent"));
      this.sendMainMenu(chatId);
    }
    this.adminPostData.delete(chatId);
  }

  public async handleCancelPost(chatId: number) {
    this.adminPostData.delete(chatId);
    this.sendMainMenu(chatId);
  }

  public async sendMainMenu(chatId: number) {
    const user = await UserService.findUserByChatId(chatId);
    const isAdmin = user && (await UserService.isUserAdmin(chatId));

    const mainMenuKeyboard = [
      [{ text: i18n.t("credit_card_button") }],
      [
        { text: i18n.t("settings_button") },
        { text: i18n.t("btn_list_products") },
      ],
      [
        { text: i18n.t("contact_us_button") },
        { text: i18n.t("about_us_button") },
      ],
    ];

    if (isAdmin) {
      mainMenuKeyboard.push([{ text: i18n.t("send_post_button") }]);
    }

    this.bot.sendMessage(chatId, i18n.t("choose_option"), {
      reply_markup: {
        keyboard: mainMenuKeyboard,
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    });
  }
  // private async sendMainMenu(chatId: number) {
  //   // Implement to send main menu
  // }
}
