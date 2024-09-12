import TelegramBot from 'node-telegram-bot-api';
import i18n from './i18n';

export default class Paginator<T> {
  private items: T[];
  private itemsPerPage: number;
  private currentPageMap: Map<number, number> = new Map();

  constructor(items: T[], itemsPerPage: number = 5) {
    this.items = items;
    this.itemsPerPage = itemsPerPage;
  }

  public setCurrentPage(chatId: number, page: number) {
    this.currentPageMap.set(chatId, page);
  }

  public getCurrentPage(chatId: number): number {
    return this.currentPageMap.get(chatId) || 1;
  }

  public getTotalPages(): number {
    return Math.ceil(this.items.length / this.itemsPerPage);
  }

  public getPageItems(chatId: number): T[] {
    const currentPage = this.getCurrentPage(chatId);
    const startIndex = (currentPage - 1) * this.itemsPerPage;
    return this.items.slice(startIndex, startIndex + this.itemsPerPage);
  }

  public getPaginationButtons(
    chatId: number,
    baseCallbackData: string
  ): TelegramBot.InlineKeyboardButton[][] {
    const currentPage = this.getCurrentPage(chatId);
    const totalPages = this.getTotalPages();
    const numPagesToShow = 3; // Number of page buttons to display in each division

    const startDivision = Math.max(
      1,
      Math.floor((currentPage - 1) / numPagesToShow) * numPagesToShow + 1
    );
    const endDivision = Math.min(totalPages, startDivision + numPagesToShow - 1);

    const paginationButtons: TelegramBot.InlineKeyboardButton[] = [];

    if (startDivision > 1) {
      paginationButtons.push({
        text: '...',
        callback_data: `${baseCallbackData}_ellipsis`,
      });
    }

    for (let i = startDivision; i <= endDivision; i++) {
      paginationButtons.push({
        text: i === currentPage ? `${i} ✅` : i.toString(),
        callback_data: `${baseCallbackData}_${i}`,
      });
    }

    if (endDivision < totalPages) {
      paginationButtons.push({
        text: '...',
        callback_data: `${baseCallbackData}_ellipsis`,
      });
    }

    const navButtons: TelegramBot.InlineKeyboardButton[] = [];
    if (currentPage > 1) {
      navButtons.push({
        text: i18n.t('prev'),
        callback_data: `${baseCallbackData}_previous`,
      });
    }
    if (currentPage < totalPages) {
      navButtons.push({
        text: i18n.t('next'),
        callback_data: `${baseCallbackData}_next`,
      });
    }

    const keyboard: TelegramBot.InlineKeyboardButton[][] = [];
    if (paginationButtons.length > 0) {
      keyboard.push(paginationButtons);
    }
    if (navButtons.length > 0) {
      keyboard.push(navButtons);
    }

    return keyboard;
  }

  public handlePaginationAction(chatId: number, action: string) {
    const currentPage = this.getCurrentPage(chatId);
    const totalPages = this.getTotalPages();

    if (action === 'previous') {
      this.setCurrentPage(chatId, Math.max(currentPage - 1, 1));
    } else if (action === 'next') {
      this.setCurrentPage(chatId, Math.min(currentPage + 1, totalPages));
    } else if (action.startsWith('page_')) {
      const page = parseInt(action.split('_')[1], 10);
      this.setCurrentPage(chatId, Math.max(1, Math.min(page, totalPages)));
    }
  }
}
