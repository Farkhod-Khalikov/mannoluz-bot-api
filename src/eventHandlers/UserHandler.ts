import TelegramBot from "node-telegram-bot-api";
import { UserService } from "../services/user.service";
import i18n from "../utils/i18n";
import { generateCreditCard } from "../utils/creditcard.generation";
import { PurchaseRequest } from "../models/purchaseRequests.schema";
// format for transactions as a caption
// `${i18n.t("bonuses_addition")} | ${sum}${i18n.t("coins")} | ${i18n.t("transaction_date")}: ${transaction.createdAt}`
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

  public async handleStart(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const isExisted = await UserService.isUserRegistered(chatId);

    if (!isExisted) {
      await this.handleUserRegistration(chatId);
    } else {
      // add setSystemLanguage to use language that is saved in user's document
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
      const phoneNumber = msg.contact.phone_number;
      const name = msg.contact.first_name;

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
        user.updatedAt = new Date();
        await user.save();
        this.bot.sendMessage(chatId, i18n.t("language_changed"));
      }
      this.sendMainMenu(chatId);
    }
  }

  public async handleChangeLanguage(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const languageKeyboard = [[{ text: "🇷🇺Русский" }, { text: "🇺🇸English" }]];
    this.bot.sendMessage(chatId, i18n.t("choose_new_language"), {
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
            this.bot.sendMessage(chatId, i18n.t("language_changed"));
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
      const transactions = await UserService.getAllTransactions(chatId);
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
          return `${transaction.description} | ${formattedDate} | ${transaction.bonuses} ${i18n.t("coins")}`;
        })
        .join("\n");

      const caption = `${i18n.t("balance_caption")}: ${balance?.amount} ${i18n.t(
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
      [{ text: i18n.t("credit_card_button") }, { text: i18n.t("btn_rules") }],
      [
        { text: i18n.t("btn_list_products") },
        { text: i18n.t("btn_list_transactions") },
      ],
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
  public async handlePurchaseRequest(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;

    // Ask the user to provide the name of the item they want to purchase
    this.bot.sendMessage(chatId, "Please write the name you want to purchase:", {
      reply_markup: {
        force_reply: true,
      },
    }).then(sentMessage => {
      // Listen for the user's reply
      const replyListener = (replyMsg: TelegramBot.Message) => {
        if (replyMsg.reply_to_message?.message_id === sentMessage.message_id) {
          this.bot.removeListener("message", replyListener);

          // Save the purchase request to the database
          const purchaseRequest = new PurchaseRequest({
            userId: replyMsg.from?.id,
            userName: replyMsg.from?.first_name,
            itemName: replyMsg.text,
            createdAt: new Date(),
          });

          purchaseRequest.save().then(async () => {
            // Notify all admins
            const admins = await UserService.getAllAdmins();
            admins.forEach(admin => {
              this.bot.sendMessage(admin.chatId, `New purchase request from ${replyMsg.from?.first_name}: ${replyMsg.text}`);
            });

            // Inform the user that their request has been received
            this.bot.sendMessage(chatId, "Your purchase request has been received. Thank you!");
          }).catch(error => {
            console.error("Failed to save purchase request:", error);
            this.bot.sendMessage(chatId, "Failed to process your request. Please try again later.");
          });
        }
      };

      this.bot.on("message", replyListener);
    });
  }
}
