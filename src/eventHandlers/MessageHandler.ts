import TelegramBot from 'node-telegram-bot-api';
import UserService from '../services/user.service';
import i18n from '../utils/i18n';
import UserHandler from './UserHandler';
import TransactionHandler from './TransactionHandler';
import AdminHandler from './AdminHandler';
import ProductHandler from './ProductHandler';
import PurchaseRequestHandler from './PurchaseRequestHandler';

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
        case '/start':
          await this.userHandler.handleStart(msg);
          break;
        case i18n.t('btn_purchase_request'):
          await this.userHandler.handlePurchaseRequest(chatId);
          break;
        case i18n.t('btn_list_requests'):
          await this.purchaseRequestHandler.handleListRequests(msg);
          break;
        case i18n.t('btn_rules'):
          await this.bot.sendMessage(chatId, 'Rules for using sum');
          break;
        case '🇷🇺Русский':
        case '🇺🇸English':
        case '🇺🇿Uzbek':
          if (this.userHandler.newUserLanguages.has(chatId)) {
            await this.userHandler.handleLanguageSelection(chatId, msg.text, true);
          } else {
            await this.userHandler.handleLanguageSelection(chatId, msg.text, false);
          }
          break;
        case i18n.t('btn_settings'):
          await this.userHandler.handleSettings(msg);
          break;
        case i18n.t('btn_list_products'):
          await this.productHandler.handleListProducts(msg);
          break;
        case i18n.t('btn_list_transactions'):
          await this.transactionHandler.handleListTransactions(msg);
          break;
        case i18n.t('btn_change_language'):
          await this.userHandler.handleChangeLanguage(msg);
          break;
        case i18n.t('btn_credit_card'):
          await this.userHandler.handleMyCreditCard(msg);
          break;
        case i18n.t('btn_contact_us'):
          await this.userHandler.handleContactUs(msg);
          break;
        case i18n.t('btn_about_us'):
          await this.userHandler.handleAboutUs(msg);
          break;
        case i18n.t('btn_go_back'):
          await this.userHandler.sendMainMenu(chatId);
          break;
        case i18n.t('btn_send_post'):
          if (isUserAdmin) {
            await this.adminHandler.handleSendPost(msg);
          }
          break;
        default:
          if (isUserAdmin) {
            // Handle admin-specific messages for post creation
            await this.adminHandler.handleAdminPostData(chatId, msg.text);
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

    if (chatId && data) {
      // transaction PAGE callback data
      if (data.startsWith('transaction_page_')) {
        const page = parseInt(data.split('_')[2], 10);
        await this.transactionHandler.handlePagination(chatId, `transaction_page_${page}`);
        // product PAGE callback data
      } else if (data.startsWith('product_page_')) {
        const page = parseInt(data.split('_')[2], 10);
        await this.productHandler.handlePagination(chatId, `product_page_${page}`);
        // requests' PAGE callback data
      } else if (data.startsWith('request_page_')) {
        const page = parseInt(data.split('_')[2], 10);
        await this.purchaseRequestHandler.handlePagination(chatId, `request_page_${page}`);
      } else {
        switch (data) {
            // transaction callback data
          case 'transaction_previous_page':
            await this.transactionHandler.handlePagination(chatId, 'transaction_previous_page');
            break;
          case 'transaction_next_page':
            await this.transactionHandler.handlePagination(chatId, 'transaction_next_page');
            break;
          case 'transaction_ellipsis_prev':
            await this.transactionHandler.handlePagination(chatId, 'transaction_ellipsis_prev');
            break;
          case 'transaction_ellipsis_next':
            await this.transactionHandler.handlePagination(chatId, 'transaction_ellipsis_next');
            break;

            // prodcut callback data
          case 'product_previous_page':
            await this.productHandler.handlePagination(chatId, 'product_previous_page');
            break;
          case 'product_next_page':
            await this.productHandler.handlePagination(chatId, 'product_next_page');
            break;
          case 'product_ellipsis_prev':
            await this.productHandler.handlePagination(chatId, 'product_ellipsis_prev');
            break;
          case 'product_ellipsis_next':
            await this.productHandler.handlePagination(chatId, 'product_ellipsis_next');
            break;
            // purchase request callback data
          case 'request_next_page':
            await this.purchaseRequestHandler.handlePagination(chatId, 'request_next_page');
            break;
          case 'request_previous_page':
            await this.purchaseRequestHandler.handlePagination(chatId, 'request_previous_page');
            break;
          case 'request_ellipsis_next':
            await this.purchaseRequestHandler.handlePagination(chatId, 'request_ellipsis_next');
            break;
          case 'request_ellipsis_prev':
            await this.purchaseRequestHandler.handlePagination(chatId, 'request_ellipsis_prev');
            break;
          case 'confirm_btn_purchase_request':
            await this.userHandler.handleConfirmPurchaseRequest(chatId);
            break;
          case 'cancel_btn_purchase_request':
            await this.userHandler.handleCancelPurchaseRequest(chatId);
            break;
          case 'confirm_post':
            await this.adminHandler.handleConfirmPost(chatId);
            break;
          case 'cancel_post':
            await this.adminHandler.handleCancelPost(chatId);
            break;

          default:
            console.warn(`Unknown callback query data: ${data}`);
        }
      }
      await this.bot.answerCallbackQuery(callbackQuery.id);
    }
  }
}
