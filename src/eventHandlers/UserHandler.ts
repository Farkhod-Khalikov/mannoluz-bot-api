// ./src/evenHandlers/UserHandler
import TelegramBot from "node-telegram-bot-api";
import { UserService } from "../services/user.service";
import i18n from "../utils/i18n";
import { generateCreditCard } from "../utils/creditcard.generation";
import { PurchaseRequest } from "../models/purchaseRequests.schema";
import { changeLanguage } from "i18next";

export default class UserHandler {
  private bot: TelegramBot;
  public newUserLanguages: Map<number, string>;
  private languageListeners: Map<number, (msg: TelegramBot.Message) => void>;
  private contactListeners: Map<number, (msg: TelegramBot.Message) => void>;

  constructor(bot: TelegramBot) {
    this.bot = bot;
    this.newUserLanguages = new Map<number, string>();

    // tried to solve double message error
    this.languageListeners = new Map<
      number,
      (msg: TelegramBot.Message) => void
    >();
    this.contactListeners = new Map<
      number,
      (msg: TelegramBot.Message) => void
    >();
  }

  // create setSystemLanguage and add to handleStart

  public async handleStart(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const isExisted = await UserService.isUserRegistered(chatId);

    if (!isExisted) {
      await this.handleUserRegistration(chatId);
    } else {
      // add setSystemLanguage to use language that is saved in user's document
      const user = await UserService.findUserByChatId(chatId);
      i18n.changeLanguage(user?.language);
      this.sendMainMenu(chatId);
    }
  }

  public async handleUserRegistration(chatId: number) {
    await this.promptLanguageSelection(chatId);

    const languageListener = async (msg: TelegramBot.Message) => {
      if (
        msg.chat.id === chatId &&
        (msg.text === "🇷🇺Русский" || msg.text === "🇺🇸English")
      ) {
        this.bot.removeListener("message", languageListener);
        this.languageListeners.delete(chatId);

        const language = msg.text;
        await this.handleLanguageSelection(chatId, language, true);

        const contactListener = async (contactMsg: TelegramBot.Message) => {
          if (contactMsg.chat.id === chatId && contactMsg.contact) {
            this.bot.removeListener("contact", contactListener);
            this.contactListeners.delete(chatId);
            await this.handleContact(contactMsg);
          }
        };

        this.bot.on("contact", contactListener);
        this.contactListeners.set(chatId, contactListener);
      }
    };

    this.bot.on("message", languageListener);
    this.languageListeners.set(chatId, languageListener);
  }

  private async promptLanguageSelection(chatId: number) {
    const languageKeyboard = [[{ text: "🇷🇺Русский" }, { text: "🇺🇸English" }]];
    this.bot.sendMessage(chatId, i18n.t("choose_language"), {
      reply_markup: {
        keyboard: languageKeyboard,
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
  }

  public async handleContact(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;

    if (msg.contact) {
      const phoneNumber = msg.contact.phone_number.replace("+", "");
      const name =
        msg.contact.first_name; /*+ " " + (msg.contact?.last_name || "")*/

      if (await UserService.findUserByPhoneNumber(phoneNumber)) {
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

  public async handleLanguageSelection(
    chatId: number,
    language: string,
    isNewUser: boolean
  ) {
    const languageCode = language === "🇷🇺Русский" ? "ru-RU" : "en-US";
    i18n.changeLanguage(languageCode);

    if (isNewUser) {
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
        await user.save();
        this.bot.sendMessage(chatId, i18n.t("language_changed"));
      }
      //this.sendMainMenu(chatId);
    }
  }

  public async handleChangeLanguage(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const languageKeyboard = [[{ text: "🇷🇺Русский" }, { text: "🇺🇸English" }]];
    this.bot.sendMessage(chatId, i18n.t("choose_language"), {
      reply_markup: {
        keyboard: languageKeyboard,
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });

    const changeLanguageListener = async (msg: TelegramBot.Message) => {
      if (msg.chat.id === chatId) {
        const language = msg.text;
        if (language === "🇷🇺Русский" || language === "🇺🇸English") {
          this.bot.removeListener("message", changeLanguageListener);
          const languageCode = language === "🇷🇺Русский" ? "ru-RU" : "en-US";
          i18n.changeLanguage(languageCode);

          const user = await UserService.findUserByChatId(chatId);
          if (user) {
            user.language = languageCode;
            user.updatedAt = new Date();
            await user.save();
            //this.bot.sendMessage(chatId, i18n.t("language_changed"));
          }
          this.sendMainMenu(chatId);
        }
      }
    };

    this.bot.on("message", changeLanguageListener);
  }

  public async handleMyCreditCard(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const user = await UserService.findUserByChatId(chatId);

    if (user) {
      const balance = user.balance;
      const filePath = await generateCreditCard(user.phone, user.id);

      // Fetch last 5 transactions
      const transactions = await UserService.getAllTransactions(user.id);
      const lastTransactions = transactions
        .sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5)
        .map((transaction: any) => {
          const date = new Date(transaction.createdAt);
          const formattedDate = `${date
            .getDate()
            .toString()
            .padStart(2, "0")}.${(date.getMonth() + 1)
            .toString()
            .padStart(2, "0")}.${date.getFullYear()}`;
          return `${
            transaction.bonuses > 0
              ? i18n.t("bonuses_addition") /*.padEnd(10, " ")*/
              : i18n.t("bonuses_removal") /*.padEnd(10, " ")*/
          } | ${formattedDate} | ${transaction.bonuses} ${i18n.t("coins")}`;
        })
        .join("\n");

      const caption = `${i18n.t("balance_caption")}: ${balance || 0} ${i18n.t(
        "coins"
      )}\n\n\n${i18n.t("last_transactions")}:\n${lastTransactions}\n`;

      this.bot
        .sendPhoto(chatId, filePath, { caption })
        .catch((error) => console.error("Failed to send QR code:", error));
    } else {
      this.bot.sendMessage(chatId, i18n.t("user_not_found"));
    }
  }
  // /send user's system languague
  public async sendUserLanguage(chatId: number) {
    const user = await UserService.findUserByChatId(chatId);

    if (user) {
      this.bot.sendMessage(chatId, user.language);
    }
    this.sendMainMenu(chatId);
  }

  public async handleSettings(msg: TelegramBot.Message) {
    const settingsKeyboard = [
      [{ text: i18n.t("change_language_button") }],
      [{ text: i18n.t("back_button") }],
    ];

    this.bot.sendMessage(msg.chat.id, i18n.t("settings_menu_prompt"), {
      reply_markup: {
        keyboard: settingsKeyboard,
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
  }

  public async sendMainMenu(chatId: number) {
    const user = await UserService.findUserByChatId(chatId);
    const isAdmin = user && (await UserService.isUserAdmin(chatId));

    const mainMenuKeyboard = [
      [{ text: i18n.t("credit_card_button") }],
      [
        { text: i18n.t("btn_list_products") },
        { text: i18n.t("btn_list_transactions") },
      ],
      [{ text: i18n.t("btn_rules") }],
      [
        { text: i18n.t("settings_button") },
        { text: i18n.t("purchase_request") },
      ],
      [
        { text: i18n.t("contact_us_button") },
        { text: i18n.t("about_us_button") },
      ],
    ];

    if (isAdmin) {
      // for admins also add button "Purchase requests" isAnswered == true
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

  public async handleContactUs(msg: TelegramBot.Message) {
    this.bot.sendMessage(msg.chat.id, i18n.t("contact_us_information"));
  }

  public async handleAboutUs(msg: TelegramBot.Message) {
    this.bot.sendMessage(msg.chat.id, i18n.t("about_us_information"));
  }

  public async handlePurchaseRequest(chatId: number) {
    const confirmKeyboard = {
      inline_keyboard: [
        [
          {
            text: i18n.t("yes_sure"),
            callback_data: "confirm_purchase_request",
          },
          {
            text: i18n.t("no_thanks"),
            callback_data: "cancel_purchase_request",
          },
        ],
      ],
    };

    this.bot.sendMessage(chatId, i18n.t("confirm_purchase_request"), {
      reply_markup: confirmKeyboard,
    });
  }

  public async handleConfirmPurchaseRequest(chatId: number) {
    this.bot.sendMessage(chatId, i18n.t("write_comment"));
    const commentListener = async (msg: TelegramBot.Message) => {
      if (msg.chat.id === chatId) {
        const comment = msg.text || "";
        const user = await UserService.findUserByChatId(chatId);

        if (user) {
          const username = user.name;
          const phonenumber = user.phone;
          if (await UserService.hasActiveRequests(phonenumber)) {
            this.bot.sendMessage(chatId, i18n.t("active_request_exist"));
            this.sendMainMenu(chatId);
            return;
          }

          // save purchase Request to mongo
          const purchaseRequest = await PurchaseRequest.create({
            username,
            phonenumber,
            comment,
            createdAt: new Date(),
          });
          if (purchaseRequest) {
            this.bot.sendMessage(chatId, "Your request has been saved!");
          }

          // notify admins
          await this.notifyAdminsOfPurchaseRequest(
            username,
            phonenumber,
            comment
          );
          this.bot.removeListener("message", commentListener);
          this.sendMainMenu(chatId);
        } else {
          this.bot.sendMessage(chatId, i18n.t("user_not_found"));
        }
      }
    };

    this.bot.on("message", commentListener);
  }

  public async handleCancelPurchaseRequest(chatId: number) {
    this.bot.sendMessage(chatId, i18n.t("purchase_request_cancelled"));
    this.sendMainMenu(chatId);
  }
  // When there are no admins retrieved from db there is an issue
  public async notifyAdminsOfPurchaseRequest(
    username: string,
    phoneNumber: string,
    comment: string
  ) {
    const admins = await UserService.getAllAdmins();
    if (!admins || admins.length === 0) {
      return;
    }
    for (const admin of admins) {
      await this.bot.sendMessage(
        admin.chatId,
        `New Purchase Request:\nUsername: ${username}\nPhone Number: +${phoneNumber}\nComment: ${comment}`
      );
    }
  }
}
