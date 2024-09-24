import TelegramBot from 'node-telegram-bot-api';
import UserService from '../services/user.service';
import i18n from '../utils/i18n';
import { generateCreditCard } from '../utils/creditcard.generation';
import { PurchaseRequest } from '../models/purchase-requests.schema';

export default class UserHandler {
  private bot: TelegramBot;
  public newUserLanguages: Map<number, string>;
  private languageListeners: Map<number, (msg: TelegramBot.Message) => void>;
  private contactListeners: Map<number, (msg: TelegramBot.Message) => void>;
  constructor(bot: TelegramBot) {
    this.bot = bot;
    this.newUserLanguages = new Map<number, string>();
    this.languageListeners = new Map<number, (msg: TelegramBot.Message) => void>();
    this.contactListeners = new Map<number, (msg: TelegramBot.Message) => void>();
  }

  public async handleStart(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const isExisted = await UserService.isUserRegistered(chatId);

    if (!isExisted) {
      await this.handleUserRegistration(chatId);
    } else {
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
        (msg.text === '🇷🇺Русский' || msg.text === '🇺🇸English' || msg.text === '🇺🇿Uzbek')
      ) {
        this.bot.removeListener('message', languageListener);
        this.languageListeners.delete(chatId);

        const language = msg.text;
        await this.handleLanguageSelection(chatId, language, true);

        const contactListener = async (contactMsg: TelegramBot.Message) => {
          if (contactMsg.chat.id === chatId && contactMsg.contact) {
            this.bot.removeListener('contact', contactListener);
            this.contactListeners.delete(chatId);
            await this.handleContact(contactMsg);
          }
        };

        this.bot.on('contact', contactListener);
        this.contactListeners.set(chatId, contactListener);
      }
    };

    this.bot.on('message', languageListener);
    this.languageListeners.set(chatId, languageListener);
  }

  private async promptLanguageSelection(chatId: number) {
    const languageKeyboard = [[{ text: '🇷🇺Русский' }, { text: '🇺🇸English' }, { text: '🇺🇿Uzbek' }]]; // Add uzUzbek
    this.bot.sendMessage(chatId, i18n.t('choose_language'), {
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
      const phoneNumber = msg.contact.phone_number.replace('+', '');
      const name = msg.contact.first_name;

      if (await UserService.findUserByphoneNumber(phoneNumber)) {
        this.bot.sendMessage(chatId, i18n.t('user_already_exists'));
      } else {
        const language = this.newUserLanguages.get(chatId) || i18n.language;
        await UserService.createUser(chatId, name, phoneNumber, language);
        this.bot.sendMessage(chatId, i18n.t('contact_saved'));
        this.newUserLanguages.delete(chatId);
        this.sendMainMenu(chatId);
      }
    }
  }

  public async handleLanguageSelection(chatId: number, language: string, isNewUser: boolean) {
    console.log('handleLanguageSelection is called');
    let languageCode: string;
    switch (language) {
      case '🇷🇺Русский':
        languageCode = 'ru-RU';
        break;
      case '🇺🇸English':
        languageCode = 'en-US';
        break;
      case '🇺🇿Uzbek':
        languageCode = 'uz-UZ';
        break;
      default:
        languageCode = 'ru-RU';
        break;
    }
    i18n.changeLanguage(languageCode);

    if (isNewUser === true) {
      this.newUserLanguages.set(chatId, languageCode);
      this.bot.sendMessage(chatId, i18n.t('share_contact'), {
        reply_markup: {
          keyboard: [[{ text: i18n.t('btn_share_contact'), request_contact: true }]],
          one_time_keyboard: true,
          resize_keyboard: true,
        },
      });
    } else {
      const user = await UserService.findUserByChatId(chatId);
      if (user) {
        user.language = languageCode;
        await user.save();
        this.bot.sendMessage(chatId, i18n.t('language_changed'));
      }
    }
  }

  public async handleChangeLanguage(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const languageKeyboard = [[{ text: '🇷🇺Русский' }, { text: '🇺🇸English' }, { text: '🇺🇿Uzbek' }]]; // add uz-Uz
    this.bot.sendMessage(chatId, i18n.t('choose_language'), {
      reply_markup: {
        keyboard: languageKeyboard,
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });

    const changeLanguageListener = async (msg: TelegramBot.Message) => {
      if (msg.chat.id === chatId) {
        const language = msg.text;
        let languageCode: string;
        if (language === '🇷🇺Русский' || language === '🇺🇸English' || language === '🇺🇿Uzbek') {
          // Add uz-UZ
          this.bot.removeListener('message', changeLanguageListener);
          switch (language) {
            case '🇷🇺Русский':
              languageCode = 'ru-RU';
              break;
            case '🇺🇸English':
              languageCode = 'en-US';
              break;
            case '🇺🇿Uzbek':
              languageCode = 'uz-UZ';
              break;
            default:
              languageCode = 'ru-RU';
              break;
          }
          i18n.changeLanguage(languageCode);

          const user = await UserService.findUserByChatId(chatId);
          if (user) {
            user.language = languageCode;
            user.updatedAt = new Date();
            await user.save();
          }
          this.sendMainMenu(chatId);
        }
      }
    };
    this.bot.on('message', changeLanguageListener);
  }

  public async handleMyCreditCard(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const user = await UserService.findUserByChatId(chatId);

    if (user) {
      const bonuses = user.bonuses;
      const money = user.money;
      const filePath = await generateCreditCard(user.phone, user.id);

      const transactions = await UserService.getAllTransactions(user.id);
      const lastTransactions = transactions
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map((transaction: any) => {
          const date = new Date(transaction.createdAt);
          const symbol = transaction.transactionType === 'money' ? '$' : i18n.t('coins');
          const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(
            date.getMonth() + 1
          )
            .toString()
            .padStart(2, '0')}.${date.getFullYear()}`;
          return `${
            transaction.sum > 0
              ? i18n.t('bonuses_addition') /*.padEnd(10, " ")*/
              : i18n.t('bonuses_removal') /*.padEnd(10, " ")*/
          } | ${formattedDate} | ${transaction.sum} ${symbol}`;
        })
        .join('\n');

      const caption = `${i18n.t('balance_caption')}: ${bonuses || 0} ${i18n.t('coins')}\n${i18n.t(
        'money_caption'
      )}: ${money || 0}$\n\n${i18n.t('last_transactions')}\n${lastTransactions}\n`;

      this.bot
        .sendPhoto(chatId, filePath, { caption })
        .catch((error) => console.error('Failed to send QR code:', error));
    } else {
      this.bot.sendMessage(chatId, i18n.t('user_not_found'));
    }
  }

  public async handleSettings(msg: TelegramBot.Message) {
    const settingsKeyboard = [
      [{ text: i18n.t('btn_change_language') }],
      [{ text: i18n.t('btn_go_back') }],
    ];

    this.bot.sendMessage(msg.chat.id, i18n.t('settings_menu_prompt'), {
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
    const isSudo = user && (await user.isSudo);
    // Default User Panel
    if (!isAdmin) {
      const mainMenuKeyboard = [
        [{ text: i18n.t('btn_credit_card') }],
        [{ text: i18n.t('btn_list_products') }, { text: i18n.t('btn_list_transactions') }],
        [{ text: i18n.t('btn_settings') }],
        [{ text: i18n.t('btn_rules') }, { text: i18n.t('btn_purchase_request') }],
        [{ text: i18n.t('btn_contact_us') }, { text: i18n.t('btn_about_us') }],
      ];
      this.bot.sendMessage(chatId, i18n.t('choose_option'), {
        reply_markup: {
          keyboard: mainMenuKeyboard,
          resize_keyboard: true,
          one_time_keyboard: false,
        },
      });
      // Admin Panel
    } else if (isAdmin && !isSudo) {
      const adminMenuKeyboard = [
        [
          {
            text: i18n.t('btn_send_post'),
          },
        ],
        [{ text: i18n.t('btn_list_products') }, { text: i18n.t('btn_list_requests') }],
        [{ text: i18n.t('btn_settings') }],
      ];
      this.bot.sendMessage(chatId, i18n.t('choose_option'), {
        reply_markup: {
          keyboard: adminMenuKeyboard,
          resize_keyboard: true,
          one_time_keyboard: false,
        },
      });
      // Sudo panel
    } else if (isSudo) {
      const sudoAdminMenuKeyboard = [
        [
          {
            text: i18n.t('btn_send_post'),
          },
        ],
        [{ text: i18n.t('btn_add_admin') }, { text: i18n.t('btn_remove_admin') }],
        [{ text: i18n.t('btn_list_products') }, { text: i18n.t('btn_list_requests') }],
        [{ text: i18n.t('btn_settings') }],
      ];
      this.bot.sendMessage(chatId, i18n.t('choose_option'), {
        reply_markup: {
          keyboard: sudoAdminMenuKeyboard,
          resize_keyboard: true,
          one_time_keyboard: false,
        },
      });
    }
  }

  public async handleAddAdmin(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;

    try {
      const replyMessage = await this.bot.sendMessage(chatId, i18n.t('enter_phone_number'), {
        reply_markup: {
          force_reply: true,
        },
      });

      console.log(`Received message: ${replyMessage.message_id}`);

      // Set up reply listener
      this.bot.onReplyToMessage(chatId, replyMessage.message_id, async (replyMsg) => {
        const phoneNumber = replyMsg.text?.trim() || '';

        // Validate phone number
        if (!/^998\d{9}$/.test(phoneNumber)) {
          await this.bot.sendMessage(chatId, i18n.t('invalid_phone_number'));
          return this.sendMainMenu(chatId);
        }

        console.log(`Phone number received: ${phoneNumber}`);

        // Check if user exists
        const user = await UserService.findUserByphoneNumber(phoneNumber);
        if (user) {
          user.isAdmin = true;
          await user.save();
          console.log(`User admin status: ${user.isAdmin}`);
          await this.bot.sendMessage(user.chatId,i18n.t("admin_granted_notification"));
          await this.bot.sendMessage(chatId, i18n.t('admin_added_success'));
        } else {
          await this.bot.sendMessage(chatId, i18n.t('user_not_found'));
        }

        // Always return to main menu
        return this.sendMainMenu(chatId);
      });
    } catch (error) {
      console.error('Error handling add admin:', error);
      await this.bot.sendMessage(chatId, i18n.t('something_went_wrong'));
      return this.sendMainMenu(chatId);
    }
  }

  public async handleRemoveAdmin(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;

    try {
      const replyMessage = await this.bot.sendMessage(chatId, i18n.t('enter_phone_number'), {
        reply_markup: {
          force_reply: true,
        },
      });

      console.log(`Received message: ${replyMessage.message_id}`);

      // Set up reply listener
      this.bot.onReplyToMessage(chatId, replyMessage.message_id, async (replyMsg) => {
        const phoneNumber = replyMsg.text?.trim() || '';

        // Validate phone number
        if (!/^998\d{9}$/.test(phoneNumber)) {
          await this.bot.sendMessage(chatId, i18n.t('invalid_phone_number'));
          return this.sendMainMenu(chatId);
        }

        console.log(`Phone number received: ${phoneNumber}`);

        // Check if user exists
        const user = await UserService.findUserByphoneNumber(phoneNumber);
        if (user) {
          user.isAdmin = false;
          await user.save();
          console.log(`User admin status: ${user.isAdmin}`);
          await this.bot.sendMessage(user.chatId,i18n.t("admin_removed_notification"));
          await this.bot.sendMessage(chatId, i18n.t('admin_removed_success'));
        } else {
          await this.bot.sendMessage(chatId, i18n.t('user_not_found'));
        }

        // Always return to main menu
        return this.sendMainMenu(chatId);
      });
    } catch (error) {
      console.error('Error handling remove admin:', error);
      await this.bot.sendMessage(chatId, i18n.t('something_went_wrong'));
      return this.sendMainMenu(chatId);
    }
  }
  public async handleContactUs(msg: TelegramBot.Message) {
    this.bot.sendMessage(msg.chat.id, i18n.t('contact_us_information'));
  }

  public async handleAboutUs(msg: TelegramBot.Message) {
    this.bot.sendMessage(msg.chat.id, i18n.t('about_us_information'));
  }

  public async handlePurchaseRequest(chatId: number) {
    const user = await UserService.findUserByChatId(chatId);

    if (!user) {
      this.bot.sendMessage(chatId, i18n.t('user_not_found'));
      return;
    }
    const confirmKeyboard = {
      inline_keyboard: [
        [
          {
            text: i18n.t('yes_sure'),
            callback_data: 'confirm_btn_purchase_request',
          },
          {
            text: i18n.t('no_thanks'),
            callback_data: 'cancel_btn_purchase_request',
          },
        ],
      ],
    };

    this.bot.sendMessage(chatId, i18n.t('confirm_btn_purchase_request'), {
      reply_markup: confirmKeyboard,
    });
  }

  public async handleConfirmPurchaseRequest(chatId: number) {
    const user = await UserService.findUserByChatId(chatId);
    const activeRequest = await PurchaseRequest.findOne({
      phoneNumber: user?.phone,
      isActive: true,
    });
    if (activeRequest) {
      this.bot.sendMessage(chatId, i18n.t('active_request_exist'));
      this.sendMainMenu(chatId);
      return;
    }
    this.bot.sendMessage(chatId, i18n.t('write_comment'));

    const commentListener = async (msg: TelegramBot.Message) => {
      if (msg.chat.id === chatId) {
        const comment = msg.text || '';

        if (user) {
          const username = user.name;
          const phoneNumber = user.phone;
          const purchaseRequest = await PurchaseRequest.create({
            username,
            phoneNumber,
            comment,
          });
          if (purchaseRequest) {
            this.bot.sendMessage(chatId, i18n.t('request_saved'));

            // notify admins
            await this.notifyAdminsOfPurchaseRequest(username, phoneNumber, comment);
            this.bot.removeListener('message', commentListener);
            this.sendMainMenu(chatId);
          }
        } else {
          this.bot.sendMessage(chatId, i18n.t('user_not_found'));
        }
      }
    };

    this.bot.on('message', commentListener);
  }

  public async handleCancelPurchaseRequest(chatId: number) {
    this.bot.sendMessage(chatId, i18n.t('btn_purchase_request_cancelled'));
    this.sendMainMenu(chatId);
  }
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
