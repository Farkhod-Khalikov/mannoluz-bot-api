import TelegramBot from 'node-telegram-bot-api';
import UserService from '../services/user.service';
import i18n from '../utils/i18n';

export default class TransactionHandler {
  private bot: TelegramBot;
  private userTransactionPages: Map<number, number> = new Map();

  constructor(bot: TelegramBot) {
    this.bot = bot;
  }

  public async handleListTransactions(msg: TelegramBot.Message) {
    // add user_not_found case if(!user) => do something
    try {
      const chatId = msg.chat.id;
      this.resetTransactionPage(chatId); // Reset the current page to 1
      await this.showTransactions(chatId);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      this.bot.sendMessage(
        msg.chat.id,
        'There was an error fetching the transaction list. Please try again later.'
      );
    }
  }

  private async showTransactions(chatId: number) {
    const user = await UserService.findUserByChatId(chatId);

    if (!user) {
      throw new Error('Could not retrieve user');
    }

    let transactions = await UserService.getAllTransactions(user.id);

    if (transactions.length === 0) {
      this.bot.sendMessage(chatId, 'No transactions available.');
      return;
    }

    transactions = transactions.sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const currentPage = this.userTransactionPages.get(chatId) || 1;
    const itemsPerPage = 5;
    const totalPages = Math.ceil(transactions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    const transactionPage = transactions
      .slice(startIndex, endIndex)
      .map((transaction: any) => {
        const date = new Date(transaction.createdAt);
        const symbol = transaction.transactionType === 'money' ? '$' : i18n.t('coins');
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1)
          .toString()
          .padStart(2, '0')}.${date.getFullYear()}`;
        return `${
          transaction.sum > 0
            ? i18n.t('bonuses_addition')/*.padEnd(10, ' ')*/
            : i18n.t('bonuses_removal')/*.padEnd(10, ' ')*/
        } | ${formattedDate} | ${transaction.sum} ${symbol}\n`;
      })
      .join('\n');

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
        callback_data: 'transaction_ellipsis_prev',
      });
    }

    for (let i = startDivision; i <= endDivision; i++) {
      paginationButtons.push({
        text: i === currentPage ? `${i} ✅` : i.toString(),
        callback_data: `transaction_page_${i}`,
      });
    }

    if (endDivision < totalPages) {
      paginationButtons.push({
        text: '...',
        callback_data: 'transaction_ellipsis_next',
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
        callback_data: 'transaction_previous_page',
      });
    }

    if (showNext) {
      navButtons.push({
        text: i18n.t('next'),
        callback_data: 'transaction_next_page',
      });
    }

    if (navButtons.length > 0) {
      keyboard.push(navButtons);
    }

    await this.bot.sendMessage(
      chatId,
      `💸*Transactions (${currentPage} of ${totalPages})*\n\n${transactionPage}`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: keyboard,
        },
      }
    );
  }

  private resetTransactionPage(chatId: number) {
    this.userTransactionPages.set(chatId, 1);
  }

  public async handlePagination(chatId: number, action: string) {
    const user = await UserService.findUserByChatId(chatId);

    if (!user) {
      throw new Error('Could not retrieve user');
    }

    const transactions = await UserService.getAllTransactions(user.id);
    const totalPages = Math.ceil(transactions.length / 5);
    const currentPage = this.userTransactionPages.get(chatId) || 1;
    const numPagesToShow = 3;

    if (action === 'transaction_previous_page') {
      this.userTransactionPages.set(
        chatId,
        Math.max((this.userTransactionPages.get(chatId) || 1) - 1, 1)
      );
    } else if (action === 'transaction_next_page') {
      this.userTransactionPages.set(
        chatId,
        Math.min((this.userTransactionPages.get(chatId) || 1) + 1, totalPages)
      );
    } else if (action.startsWith('transaction_page_')) {
      const page = parseInt(action.split('_')[2], 10);
      this.userTransactionPages.set(chatId, Math.max(1, Math.min(page, totalPages)));
    } else if (action === 'transaction_ellipsis_prev') {
      const startDivision = Math.max(
        1,
        Math.floor((currentPage - 1) / numPagesToShow) * numPagesToShow + 1
      );
      const newStartPage = Math.min(totalPages, startDivision - numPagesToShow);
      this.userTransactionPages.set(chatId, newStartPage);
    } else if (action === 'transaction_ellipsis_next') {
      const newStartPage = Math.min(totalPages, currentPage + numPagesToShow);
      this.userTransactionPages.set(chatId, newStartPage);
    }

    await this.showTransactions(chatId);
  }
}
