import TelegramBot from "node-telegram-bot-api";
import { UserService } from "../services/UserService";
import { generateAndSaveQRCodePng } from "../utils/creditCardGeneration";
import i18n from "../utils/i18n";

export default class MessageController {
  private bot: TelegramBot;
  private newUserLanguages: Map<number, string>;
  private adminPostData: Map<number, { title: string | null; message: string | null }>;

  constructor(bot: TelegramBot) {
    this.bot = bot;
    this.newUserLanguages = new Map<number, string>();
    this.adminPostData = new Map<number, { title: string | null; message: string | null }>();
  }

  public async handleMessage(msg: TelegramBot.Message) {
    if (msg.contact) {
      await this.handleContact(msg);
      return;
    }

    const chatId = msg.chat.id;
    const userIsAdmin = await UserService.isUserAdmin(chatId);

    if (this.newUserLanguages.has(chatId)) {
      await this.handleLanguageSelection(chatId, msg.text || "", true);
      return;
    }

    if (this.adminPostData.has(chatId)) {
      await this.handleAdminPostData(chatId, msg.text || "");
      return;
    }

    switch (msg.text) {
      case "/start":
        await this.handleStart(msg);
        break;
      case i18n.t("settings_button"):
        await this.handleSettings(msg);
        break;
      case i18n.t("change_language_button"):
        await this.handleChangeLanguage(msg);
        break;
      case i18n.t("credit_card_button"):
        await this.handleMyCreditCard(msg);
        break;
      case i18n.t("contact_us_button"):
        await this.handleContactUs(msg);
        break;
      case i18n.t("about_us_button"):
        await this.handleAboutUs(msg);
        break;
      case i18n.t("back_button"):
        await this.sendMainMenu(chatId);
        break;
      case "🇷🇺Русский":
      case "🇺🇸English":
        await this.handleLanguageSelection(chatId, msg.text || "", false);
        break;
      case i18n.t("send_post_button"):
        if (userIsAdmin) {
          await this.handleSendPost(msg);
        }
        break;
      default:
        this.bot.sendMessage(chatId, i18n.t("command_not_recognized"));
    }
  }

  private async handleStart(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const isExisted = await UserService.isUserRegistered(chatId);

    if (!isExisted) {
      const languageKeyboard = [[{ text: "🇷🇺Русский" }, { text: "🇺🇸English" }]];
      this.bot.sendMessage(chatId, i18n.t("choose_language"), {
        reply_markup: {
          keyboard: languageKeyboard,
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
      this.newUserLanguages.set(chatId, "");
    } else {
      const user = await UserService.findUserByChatId(chatId);
      i18n.changeLanguage(user?.language);
      
      this.sendMainMenu(chatId);
    }
  }

  private async handleLanguageSelection(
    chatId: number,
    language: string,
    isRegistration: boolean
  ) {
    if (language !== "🇷🇺Русский" && language !== "🇺🇸English") {
      this.bot.sendMessage(chatId, i18n.t("choose_language"));
      return;
    }

    const languageCode = language === "🇷🇺Русский" ? "ru-RU" : "en-US";
    i18n.changeLanguage(languageCode);

    if (isRegistration) {
      this.newUserLanguages.set(chatId, languageCode);
      this.bot.sendMessage(chatId, i18n.t("share_contact"), {
        reply_markup: {
          keyboard: [
            [{ text: i18n.t("share_contact_button"), request_contact: true }],
          ],
          one_time_keyboard: true,
          resize_keyboard: true,
        },
      });
    } else {
      const user = await UserService.findUserByChatId(chatId);
      if (user) {
        user.language = languageCode;
        user.updatedAt = new Date();
        await user.save();
        this.bot.sendMessage(chatId, i18n.t("language_changed"));
      }
      this.sendMainMenu(chatId);
    }
  }

  private async handleContact(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const contact = msg.contact;

    if (contact) {
      const phoneNumber = contact.phone_number;
      const name = contact.first_name;

      if (await UserService.findUserByContact(phoneNumber)) {
        this.bot.sendMessage(chatId, i18n.t("user_already_exists"));
      } else {
        const language = this.newUserLanguages.get(chatId) || i18n.language;
        await UserService.createUser(chatId, name, phoneNumber, language);
        this.bot.sendMessage(chatId, i18n.t("contact_saved"));
        this.newUserLanguages.delete(chatId);
        this.sendMainMenu(chatId);
      }
    }
  }

  private async handleMyCreditCard(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const user = await UserService.findUserByChatId(chatId);

    if (user) {
      const balance = user.balance;
      const filePath = await generateAndSaveQRCodePng(user.phone);
      this.bot
        .sendPhoto(chatId, filePath, { caption: `${i18n.t("balance_caption")}: ${balance}` })
        .catch((error) => console.error("Failed to send QR code:", error));
    } else {
      this.bot.sendMessage(chatId, i18n.t("user_not_found"));
    }
  }

  private async handleSettings(msg: TelegramBot.Message) {
    const isAdmin = await UserService.isUserAdmin(msg.chat.id);

    const settingsKeyboard = [
      [{ text: i18n.t("change_language_button") }],
      [{ text: i18n.t("back_button") }],
    ];
    
    if (isAdmin) {
      settingsKeyboard.push([{ text: i18n.t("send_post_button") }]);
    }

    this.bot.sendMessage(msg.chat.id, i18n.t("settings_menu_prompt"), {
      reply_markup: {
        keyboard: settingsKeyboard,
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
  }

  private async handleSendPost(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    this.bot.sendMessage(chatId, i18n.t("provide_post_title"), {
      reply_markup: {
        force_reply: true,
      },
    });

    // Prepare for title input
    this.adminPostData.set(chatId, { title: null, message: null });
  }

  private async handleAdminPostData(chatId: number, text: string) {
    const postData = this.adminPostData.get(chatId);

    if (postData) {
      if (!postData.title) {
        postData.title = text;
        this.bot.sendMessage(chatId, i18n.t("provide_post_message"), {
          reply_markup: {
            force_reply: true,
          },
        });
      } else if (!postData.message) {
        postData.message = text;

        // Send the post to all users
        const users = await UserService.getAllUsers();
        for (const user of users) {
          this.bot.sendMessage(user.chatId, `${postData.title}\n\n${postData.message}`);
        }

        this.bot.sendMessage(chatId, i18n.t("post_sent"));
        this.adminPostData.delete(chatId);
      }
    }
  }

  private async handleChangeLanguage(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const user = await UserService.findUserByChatId(chatId);

    if (user) {
      this.bot.sendMessage(chatId, i18n.t("choose_language"), {
        reply_markup: {
          keyboard: [
            [{ text: "🇷🇺Русский" }, { text: "🇺🇸English" }],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
    } else {
      this.bot.sendMessage(chatId, i18n.t("user_not_found"));
    }
  }

  private async handleContactUs(msg: TelegramBot.Message) {
    this.bot.sendMessage(msg.chat.id, i18n.t("contact_us_information"));
  }

  private async handleAboutUs(msg: TelegramBot.Message) {
    this.bot.sendMessage(msg.chat.id, i18n.t("about_us_information"));
  }

  private async sendMainMenu(chatId: number) {
    const isAdmin = await UserService.isUserAdmin(chatId);
    const mainMenuKeyboard = [
      [{ text: i18n.t("credit_card_button") }],
      [{ text: i18n.t("settings_button") }],
      [
        { text: i18n.t("contact_us_button") },
        { text: i18n.t("about_us_button") },
      ],
    ];

    // if (isAdmin) {
    //   mainMenuKeyboard.push([{ text: i18n.t("send_post_button") }]);
    // }

    this.bot.sendMessage(chatId, i18n.t("choose_option"), {
      reply_markup: { keyboard: mainMenuKeyboard, resize_keyboard: true },
    });
  }
}
