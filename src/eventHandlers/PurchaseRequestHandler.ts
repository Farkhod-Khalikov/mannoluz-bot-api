import TelegramBot from 'node-telegram-bot-api';
import { PurchaseRequest } from '../models/purchaseRequests.schema';
import i18n from '../utils/i18n';

export default class PurchaseRequestHandler {
  private bot: TelegramBot;
  private userRequestPages: Map<number, number> = new Map();

  constructor(bot: TelegramBot) {
    this.bot = bot;
  }

  public async handleListRequests(msg: TelegramBot.Message) {
    try {
      const chatId = msg.chat.id;
      this.resetRequestPage(chatId); // Reset the current page to 1
      await this.showRequests(chatId);
    } catch (error) {
      console.error('Error fetching requests:', error);
      this.bot.sendMessage(
        msg.chat.id,
        'There was an error fetching the requests. Please try again later.'
      );
    }
  }

  private async showRequests(chatId: number) {
    const requests = await PurchaseRequest.find().sort({ isActive: -1, createdAt: -1 });

    if (requests.length === 0) {
      this.bot.sendMessage(chatId, 'No purchase requests available.');
      return;
    }

    const currentPage = this.userRequestPages.get(chatId) || 1;
    const itemsPerPage = 5;
    const totalPages = Math.ceil(requests.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    const requestPage = requests
      .slice(startIndex, endIndex)
      .map(
        (request: any) =>
          `*Request by:* ${request.username}\n*Phone:* ${request.phoneNumber}\n*Comment:* ${
            request.comment
          }\n*Active:* ${
            request.isActive ? 'Yes' : 'No'
          }\n*Date:* ${request.createdAt.toLocaleDateString()}`
      )
      .join('\n\n');

    const paginationButtons: TelegramBot.InlineKeyboardButton[] = [];
    const numPagesToShow = 3;

    const startDivision = Math.max(
      1,
      Math.floor((currentPage - 1) / numPagesToShow) * numPagesToShow + 1
    );
    const endDivision = Math.min(totalPages, startDivision + numPagesToShow - 1);

    const showPrev = currentPage > 1;
    const showNext = currentPage < totalPages;

    if (startDivision > 1) {
      paginationButtons.push({
        text: '...',
        callback_data: 'request_page_ellipsis', // request_page_prev_ellipsis
      });
    }

    for (let i = startDivision; i <= endDivision; i++) {
      paginationButtons.push({
        text: i === currentPage ? `${i} ✅` : i.toString(),
        callback_data: `request_page_${i}`,
      });
    }

    if (endDivision < totalPages) {
      paginationButtons.push({
        text: '...',
        callback_data: 'request_page_ellipsis',
      });
    }

    const keyboard: TelegramBot.InlineKeyboardButton[][] = [];

    if (paginationButtons.length > 0) {
      keyboard.push(paginationButtons);
    }

    const navButtons: TelegramBot.InlineKeyboardButton[] = [];
    if (showPrev) {
      navButtons.push({
        text: i18n.t('prev'),
        callback_data: 'request_previous_page',
      });
    }
    if (showNext) {
      navButtons.push({
        text: i18n.t('next'),
        callback_data: 'request_next_page',
      });
    }

    if (navButtons.length > 0) {
      keyboard.push(navButtons);
    }

    await this.bot.sendMessage(
      chatId,
      `*Purchase Requests (Page ${currentPage} of ${totalPages}):*\n\n${requestPage}`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: keyboard,
        },
      }
    );
  }

  private resetRequestPage(chatId: number) {
    this.userRequestPages.set(chatId, 1);
  }

  public async handlePagination(chatId: number, action: string) {
    const requests = await PurchaseRequest.find().sort({ isActive: -1 });
    const totalPages = Math.ceil(requests.length / 5);

    if (action === 'request_previous_page') {
      this.userRequestPages.set(chatId, Math.max((this.userRequestPages.get(chatId) || 1) - 1, 1));
    } else if (action === 'request_next_page') {
      this.userRequestPages.set(
        chatId,
        Math.min((this.userRequestPages.get(chatId) || 1) + 1, totalPages)
      );
    } else if (action.startsWith('request_page_')) {
      const page = parseInt(action.split('_')[2], 10);
      this.userRequestPages.set(chatId, Math.max(1, Math.min(page, totalPages)));
    }

    await this.showRequests(chatId);
  }
}
