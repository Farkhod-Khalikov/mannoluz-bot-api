import TelegramBot from 'node-telegram-bot-api';
import UserService from '../services/user.service';
import i18n from '../utils/i18n';
import { PurchaseRequest } from '../models/purchaseRequests.schema';

export default class PurchaseRequesHandler {
  private bot: TelegramBot;
  private purchaseRequestPages: Map<number, number> = new Map();

  constructor(bot: TelegramBot) {
    this.bot = bot;
  }

  public async handleListRequests(msg: TelegramBot.Message) {
    // add user_not_found case if(!user) => do something
    try {
      const chatId = msg.chat.id;
      this.resetRequestPage(chatId); // Reset the current page to 1
      await this.showRequests(chatId);
    } catch (error) {
      console.error('Error fetching requests:', error);
      this.bot.sendMessage(
        msg.chat.id,
        'There was an error fetching the requests list. Please try again later.'
      );
    }
  }

  private async showRequests(chatId: number) {
    const user = await UserService.findUserByChatId(chatId);

    if (!user) {
      throw new Error('Could not retrieve user');
    }

    // get only active requests
    let requests = await PurchaseRequest.find(/*{ isActive: true }*/);

    if (requests.length === 0) {
      this.bot.sendMessage(chatId, 'No requests available.');
      return;
    }

    requests = requests.sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const currentPage = this.purchaseRequestPages.get(chatId) || 1;
    const itemsPerPage = 5;
    const totalPages = Math.ceil(requests.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    // page format
    const requestPage = requests
      .slice(startIndex, endIndex)
      .map((request: any) => {
        const date = new Date(request.createdAt);
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1)
          .toString()
          .padStart(2, '0')}.${date.getFullYear()}`;
        // the message here
        return `Username: ${request.username}\nPhonenumber: ${request.phoneNumber}\nComment:${
          request.comment
        }\nActive: ${request.isActive ? 'Yes' : 'No'}\nCreatedAt: ${formattedDate}`;
      })
      .join('\n\n');

    const paginationButtons: TelegramBot.InlineKeyboardButton[] = [];
    const numPagesToShow = 3; // Number of page buttons to display in each division

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
        callback_data: 'request_ellipsis_prev',
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
        callback_data: 'request_ellipsis_next',
      });
    }

    // Arrange buttons in separate lines
    const keyboard: TelegramBot.InlineKeyboardButton[][] = [];

    // Page buttons
    if (paginationButtons.length > 0) {
      keyboard.push(paginationButtons);
    }

    // Prev and Next buttons
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
      `*Requests (Page ${currentPage} of ${totalPages}):*\n\n${requestPage}`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: keyboard,
        },
      }
    );
  }

  private resetRequestPage(chatId: number) {
    this.purchaseRequestPages.set(chatId, 1);
  }

  public async handlePagination(chatId: number, action: string) {
    const user = await UserService.findUserByChatId(chatId);

    if (!user) {
      throw new Error('Could not retrieve user');
    }

    const requests = await PurchaseRequest.find({ /*isActive: true*/ });
    const totalPages = Math.ceil(requests.length / 5);
    const currentPage = this.purchaseRequestPages.get(chatId) || 1;
    const numPagesToShow = 3;

    if (action === 'request_previous_page') {
      this.purchaseRequestPages.set(
        chatId,
        Math.max((this.purchaseRequestPages.get(chatId) || 1) - 1, 1)
      );
    } else if (action === 'request_next_page') {
      this.purchaseRequestPages.set(
        chatId,
        Math.min((this.purchaseRequestPages.get(chatId) || 1) + 1, totalPages)
      );
    } else if (action.startsWith('request_page_')) {
      const page = parseInt(action.split('_')[2], 10);
      this.purchaseRequestPages.set(chatId, Math.max(1, Math.min(page, totalPages)));
    } else if (action === 'request_ellipsis_prev') {
      const startDivision = Math.max(
        1,
        Math.floor((currentPage - 1) / numPagesToShow) * numPagesToShow + 1
      );
      const newStartPage = Math.min(totalPages, startDivision - numPagesToShow);
      this.purchaseRequestPages.set(chatId, newStartPage);
    } else if (action === 'request_ellipsis_next') {
      const newStartPage = Math.min(totalPages, currentPage + numPagesToShow);
      this.purchaseRequestPages.set(chatId, newStartPage);
    }

    await this.showRequests(chatId);
  }
}
