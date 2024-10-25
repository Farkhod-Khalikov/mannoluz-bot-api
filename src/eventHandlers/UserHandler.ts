import moment from 'moment';
import fs from 'fs';
import path from 'path';
import TelegramBot from 'node-telegram-bot-api';
import UserService from '../services/user.service';
import i18n from '../utils/i18n';
import { generateCreditCard } from '../utils/creditcard';
import { PurchaseRequest } from '../models/purchase-requests.schema';
import { generateReconciliationPDF } from '../utils/reconciliation-act';
import MoneyTransaction from '../models/money-transactions.schema';

export default class UserHandler {
  private bot: TelegramBot;
  public newUserLanguages: Map<number, string>;
  constructor(bot: TelegramBot) {
    this.bot = bot;
    this.newUserLanguages = new Map<number, string>();
  }

  public async handleStart(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const isExisted = await UserService.isUserRegistered(chatId);

    if (!isExisted) {
      // If user is not registered, start the registration process
      await this.handleUserRegistration(chatId);
    } else {
      // If user is already registered, allow them to change language and show main menu
      const user = await UserService.findUserByChatId(chatId);
      i18n.changeLanguage(user?.language);
      this.sendMainMenu(chatId);
    }
  }

  // Handles the user registration process
  public async handleUserRegistration(chatId: number) {
    // Step 1: Ask the user to select a language using a custom keyboard
    const languageKeyboard = [[{ text: '🇷🇺Русский' }, { text: '🇺🇸English' }, { text: '🇺🇿Uzbek' }]];

    const replyToLanguageMsg = await this.bot.sendMessage(chatId, i18n.t('choose_language'), {
      reply_markup: {
        keyboard: languageKeyboard,
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });

    // Step 2: Listen for the next message from the user for language selection
    this.bot.once('message', async (languageResponse: TelegramBot.Message) => {
      const language = languageResponse.text;
      if (language) {
        // If a valid language was selected, continue the process
        if (['🇷🇺Русский', '🇺🇸English', '🇺🇿Uzbek'].includes(language)) {
          await this.handleLanguageSelection(chatId, language, true);

          // Step 3: Ask the user to share their contact after language selection
          const replyToContactMsg = await this.bot.sendMessage(chatId, i18n.t('share_contact'), {
            reply_markup: {
              keyboard: [[{ text: i18n.t('btn_share_contact'), request_contact: true }]],
              one_time_keyboard: true,
              resize_keyboard: true,
            },
          });

          // Step 4: Wait for the user's contact reply
          this.bot.once('message', async (contactResponse: TelegramBot.Message) => {
            if (contactResponse.contact) {
              await this.handleContact(contactResponse);
            } else {
              // Handle case where user does not share contact
              return this.bot.sendMessage(chatId, i18n.t('contact_not_shared'));
            }
          });
        } else {
          // Handle invalid language selection
          await this.bot.sendMessage(chatId, i18n.t('invalid_language'));
          // Re-prompt language selection
          return this.handleUserRegistration(chatId);
        }
      }
    });
  }
  // Helper function to wait for a reply
  private awaitReply(chatId: number, messageId: number): Promise<TelegramBot.Message> {
    return new Promise((resolve) => {
      this.bot.onReplyToMessage(chatId, messageId, (msg) => {
        resolve(msg);
      });
    });
  }

  // Handles contact sharing during registration
  public async handleContact(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const phoneNumber = msg.contact?.phone_number.replace('+', '');
    const name = msg.contact?.first_name;
    if (phoneNumber && name) {
      const existingUser = await UserService.findUserByphoneNumber(phoneNumber);
      if (existingUser) {
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

  // Handles language selection during registration and language change for existing users
  public async handleLanguageSelection(chatId: number, language: string, isNewUser: boolean) {
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
    }
    i18n.changeLanguage(languageCode);

    if (isNewUser) {
      this.newUserLanguages.set(chatId, languageCode);
    } else {
      const user = await UserService.findUserByChatId(chatId);
      if (user) {
        user.language = languageCode;
        await user.save();
        this.bot.sendMessage(chatId, i18n.t('language_changed'));
      }
    }
  }

  // Handles language changes for already registered users
  public async handleChangeLanguage(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const languageKeyboard = [[{ text: '🇷🇺Русский' }, { text: '🇺🇸English' }, { text: '🇺🇿Uzbek' }]];
    this.bot.sendMessage(chatId, i18n.t('choose_language'), {
      reply_markup: {
        keyboard: languageKeyboard,
        resize_keyboard: true,
        force_reply: true,
        one_time_keyboard: true,
      },
    });

    const changeLanguageListener = async (msg: TelegramBot.Message) => {
      if (msg.chat.id === chatId) {
        const language = msg.text;
        if (['🇷🇺Русский', '🇺🇸English', '🇺🇿Uzbek'].includes(language || '')) {
          // Remove listener once language is selected
          this.bot.removeListener('message', changeLanguageListener);

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
          }
          i18n.changeLanguage(languageCode);

          // Update user's language in the database
          const user = await UserService.findUserByChatId(chatId);
          if (user) {
            user.language = languageCode;
            user.updatedAt = new Date();
            await user.save();
          }

          // Send the updated main menu
          this.sendMainMenu(chatId);
        }
      }
    };

    // Add language change listener
    this.bot.on('message', changeLanguageListener);
  }

  public async handleMyCreditCard(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const user = await UserService.findUserByChatId(chatId);

    if (user) {
      const bonuses = await UserService.updateBonusesBalance(user.id);
      const money = await UserService.updateMoneyBalance(user.id);
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
        [{ text: i18n.t('btn_settings') }, { text: i18n.t('btn_get_reconciliation_act') }],
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
          await this.bot.sendMessage(user.chatId, i18n.t('admin_granted_notification'));
          await this.bot.sendMessage(chatId, i18n.t('admin_added_success'));
        } else {
          await this.bot.sendMessage(chatId, i18n.t('admin_not_found'));
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
          await this.bot.sendMessage(user.chatId, i18n.t('admin_removed_notification'));
          await this.bot.sendMessage(chatId, i18n.t('admin_removed_success'));
        } else {
          await this.bot.sendMessage(chatId, i18n.t('admin_not_found'));
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
  public async handleReconciliationAct(msg: TelegramBot.Message) {
    let startDate: string;
    let endDate: string;

    const startDateForceReplyMsg = await this.bot.sendMessage(
      msg.chat.id,
      i18n.t('choose_start_date'),
      {
        reply_markup: {
          force_reply: true,
        },
      }
    );

    this.bot.onReplyToMessage(msg.chat.id, startDateForceReplyMsg.message_id, async (reply) => {
      startDate = reply.text || '';
      console.log(
        `Start Date Validation [${startDate}]: `,
        (await this.isValidDate(startDate)) ? 'Valid' : 'Invalid'
      );

      if (await this.isValidDate(startDate)) {
        const endDateForceReplyMsg = await this.bot.sendMessage(
          msg.chat.id,
          i18n.t('choose_end_date'),
          {
            reply_markup: {
              force_reply: true,
            },
          }
        );

        this.bot.onReplyToMessage(msg.chat.id, endDateForceReplyMsg.message_id, async (reply) => {
          endDate = reply.text || '';
          console.log(
            `End Date Validation [${endDate}]: `,
            (await this.isValidDate(endDate)) ? 'Valid' : 'Invalid'
          );

          if (await this.isValidDate(endDate)) {
            const tempDir = path.resolve(__dirname, '../temp');

            // Ensure the temp directory exists
            if (!fs.existsSync(tempDir)) {
              fs.mkdirSync(tempDir, { recursive: true });
            }

            // Change the name HERE
            const pdfPath = path.resolve(tempDir, `reconciliation_${msg.chat.id}.pdf`);

            // Fetch transactions from the database
            const user = await UserService.findUserByChatId(msg.chat.id);
            console.log(user);

            const transactions = await MoneyTransaction.find({ userId: user?.id });
            console.log(transactions);

            // Convert user-provided dates from dd.mm.yyyy to yyyy-mm-dd
            const startDateISO = moment(startDate, 'DD.MM.YYYY').format('YYYY-MM-DD');
            const endDateISO = moment(endDate, 'DD.MM.YYYY').format('YYYY-MM-DD');

            // Calculate the initial balance and daily summaries
            const dailySummary: { [key: string]: { addition: number; removal: number } } = {};
            let initBalance = null; // Initialize initBalance to null

            for (const transaction of transactions) {
              if (!transaction.createdAt) {
                console.warn('Transaction createdAt is undefined for transaction:', transaction);
                continue; // skip if createdAt is undefined
              }

              const transactionDate = moment(transaction.createdAt).format('YYYY-MM-DD'); // Get date in YYYY-MM-DD format

              // Check if the transaction date is within the provided range
              if (transactionDate >= startDateISO && transactionDate <= endDateISO) {
                // Initialize daily summary if it doesn't exist
                if (!dailySummary[transactionDate]) {
                  dailySummary[transactionDate] = { addition: 0, removal: 0 };
                }

                // Sum additions and removals
                if (transaction.sum > 0) {
                  dailySummary[transactionDate].addition += transaction.sum;
                } else {
                  dailySummary[transactionDate].removal += Math.abs(transaction.sum);
                }

                // Set initBalance from the first transaction's oldBalance after startDate
                if (initBalance === null) {
                  initBalance = transaction.oldBalance || 0; // Get the oldBalance of the first transaction found
                }
              }
            }

            // Ensure that initBalance has been set
            if (initBalance === null) {
              // If no transactions were found, handle this case
              console.warn('No transactions found within the specified date range.');
              initBalance = 0; // Set to 0 or handle as needed
            }

            // Prepare table rows
            const tableRows: {
              dateRange: string;
              initBalance: number;
              addition: number;
              removal: number;
              result: number;
            }[] = [];
            let sumOfAllPositives = 0;
            let sumOfAllNegatives = 0;

            for (const date in dailySummary) {
              const dailyData = dailySummary[date];
              sumOfAllPositives += dailyData.addition;
              sumOfAllNegatives += dailyData.removal;

              // Prepare row for each date
              tableRows.push({
                dateRange: date,
                initBalance: initBalance, // Use the initialized balance
                addition: dailyData.addition,
                removal: dailyData.removal,
                result: 0, // Placeholder for now
              });
            }

            // Calculate total result
            const totalResult = initBalance + sumOfAllPositives - sumOfAllNegatives;

            // Fill the result in the last row
            if (tableRows.length > 0) {
              tableRows[tableRows.length - 1].result = totalResult;
            }

            // Generate PDF
            await generateReconciliationPDF(
              startDate,
              endDate,
              pdfPath,
              tableRows,
              initBalance,
              sumOfAllPositives,
              sumOfAllNegatives
            );

            // Check if the file exists before sending
            if (fs.existsSync(pdfPath)) {
              console.log(`Sending file: ${pdfPath}`);
              await this.bot.sendDocument(msg.chat.id, pdfPath);

              // Cleanup the file after sending
              fs.unlinkSync(pdfPath);
            } else {
              console.log(`File does not exist at path: ${pdfPath}`);
              await this.bot.sendMessage(msg.chat.id, 'Failed to generate reconciliation report.');
            }

            await this.sendMainMenu(msg.chat.id);
          } else {
            await this.bot.sendMessage(msg.chat.id, 'Incorrect end date provided');
            await this.sendMainMenu(msg.chat.id);
          }
        });
      } else {
        await this.bot.sendMessage(msg.chat.id, 'Incorrect start date provided');
        await this.sendMainMenu(msg.chat.id);
      }
    });
  }

  // date validation

  private async isValidDate(date: string) {
    // Regular expression for dd.mm.yyyy format
    const regex = /^\d{2}\.\d{2}\.\d{4}$/;

    // Check if the date matches the dd.mm.yyyy format
    if (!regex.test(date)) {
      return false;
    }

    // Extract day, month, and year from the date string
    const [day, month, year] = date.split('.').map(Number);

    // Create a date object with the parsed day, month, and year
    const parsedDate = new Date(year, month - 1, day);

    // Check if the parsed date is valid by comparing the parts
    if (
      parsedDate.getFullYear() === year &&
      parsedDate.getMonth() === month - 1 && // Months are 0-indexed in JS
      parsedDate.getDate() === day
    ) {
      return true;
    }

    return false;
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
