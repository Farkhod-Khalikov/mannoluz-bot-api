import TelegramBot from 'node-telegram-bot-api';
import UserService from '../services/user.service';
import i18n from '../utils/i18n';
import fs from 'fs';
import path from 'path';
import Post from '../models/posts.schema';
import { v4 as uuidv4 } from 'uuid';
import UserHandler from './UserHandler';
export default class AdminHandler {
  private userHandler: UserHandler;
  private bot: TelegramBot;
  private adminPostData: Map<
    number,
    {
      adminName: string | null;
      title: string | null;
      message: string | null;
      image: string | null;
    }
  > = new Map();

  private tempDir: string;

  constructor(bot: TelegramBot) {
    this.bot = bot;
    this.userHandler = new UserHandler(bot);
    this.tempDir = path.join(__dirname, '..', 'temp/admin-posts');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir);
    }
  }

  // Step 1: Handle Title Input
  public async handleSendPost(message: TelegramBot.Message) {
    const chatId = message.chat.id;
    // add isAdmin check
    // Step 1: Handle title input
    const title = await this.handlePostTitleReply(chatId);
    if (!title) return;

    // Step 2: Handle message input
    const body = await this.handlePostBodyReply(chatId);
    if (!body) return;

    // Store title and message
    this.adminPostData.set(chatId, {
      adminName: 'adminName', // Replace with logic to get the admin's name
      title: title,
      message: body,
      image: null,
    });

    // Step 3: Ask for image input
    await this.askForImage(chatId);
  }

  // Step 2: Handle title reply
  private async handlePostTitleReply(chatId: number): Promise<string | null> {
    const forceReplyMessageId = await this.bot.sendMessage(chatId, i18n.t('provide_post_title'), {
      reply_markup: { force_reply: true },
    });

    return new Promise((resolve) => {
      this.bot.onReplyToMessage(chatId, forceReplyMessageId.message_id, async (replyMsg) => {
        if (!replyMsg.text) {
          this.adminPostData.delete(chatId);
          await this.bot.sendMessage(
            chatId,
            'You have provided incorrect reply message for text (string) holder'
          );
          await this.userHandler.sendMainMenu(chatId);
          return;
        }
        resolve(replyMsg.text ? replyMsg.text : null);
      });
    });
  }

  // Step 3: Handle message reply
  private async handlePostBodyReply(chatId: number): Promise<string | null> {
    const ForceReplyMessageId = await this.bot.sendMessage(chatId, i18n.t('provide_post_message'), {
      reply_markup: { force_reply: true },
    });

    return new Promise((resolve) => {
      this.bot.onReplyToMessage(chatId, ForceReplyMessageId.message_id, async (replyMsg) => {
        if (!replyMsg.text) {
          this.adminPostData.delete(chatId);
          await this.bot.sendMessage(
            chatId,
            'You have provided incorrect reply message for text (string) holder'
          );
          await this.userHandler.sendMainMenu(chatId);
          return;
        }
        resolve(replyMsg.text ? replyMsg.text : null);
      });
    });
  }

  // Step 4: Ask for image input
  private async askForImage(chatId: number): Promise<void> {
    const reply = await this.bot.sendMessage(chatId, i18n.t('provide_post_image'), {
      reply_markup: { force_reply: true },
    });

    await this.bot.onReplyToMessage(chatId, reply.message_id, async (replyMsg) => {
      // if user has written basic text message reply
      if (!replyMsg.photo) {
        this.adminPostData.delete(chatId);
        await this.bot.sendMessage(chatId, 'you have provided incorrect image format.');
        await this.userHandler.sendMainMenu(chatId);
        return;
      }
    });
  }

  // Handle image upload
  public async handleImageUpload(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const currentPostData = this.adminPostData.get(chatId);
    // Check if there's an ongoing post creation
    if (!currentPostData || !currentPostData.title || !currentPostData.message) {
      return;
    }
    const photo = msg.photo ? msg.photo[msg.photo.length - 1] : null;
    console.log(photo);

    if (photo) {
      const fileId = photo.file_id;
      const tempFilePath = await this.bot.downloadFile(fileId, this.tempDir);

      // Generate unique filename
      const uniqueId = uuidv4();
      const fileName = `${currentPostData.adminName}_${uniqueId}.png`;
      const newFilePath = path.join(this.tempDir, fileName);

      // Rename the file to the desired format
      fs.rename(tempFilePath, newFilePath, (err) => {
        if (err) {
          console.error('Failed to rename temp file:', err);
        }
      });

      // Update post data with image path
      currentPostData.image = newFilePath;

      // Show post summary and confirmation buttons
      const postSummary = `
*Title:* ${currentPostData.title}
*Message:* ${currentPostData.message}
      `;

      this.bot.sendPhoto(chatId, newFilePath, {
        caption: postSummary,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: i18n.t('btn_confirm'), callback_data: 'confirm_post' }],
            [{ text: i18n.t('btn_cancel_post_creation'), callback_data: 'cancel_post' }],
          ],
        },
      });
    }     
  }

  // Handle post confirmation
  public async handleConfirmPost(chatId: number) {
    const postData = this.adminPostData.get(chatId);

    if (postData && postData.title && postData.message && postData.image) {
      const creator = await UserService.getUserName(chatId);
      const post = new Post({
        creator,
        title: postData.title,
        message: postData.message,
        createdAt: new Date(),
        imagePath: postData.image,
      });
      await post.save();

      // Notify all users
      const users = await UserService.getAllUsers();
      for (const user of users) {
        this.bot.sendPhoto(user.chatId, postData.image, {
          caption: `*${postData.title}*\n\n${postData.message}`,
          parse_mode: 'Markdown',
        });
      }
      this.bot.sendMessage(chatId, i18n.t('post_sent'));
      this.userHandler.sendMainMenu(chatId);
    }

    // Clean up post data
    this.adminPostData.delete(chatId);
  }

  // Handle post cancellation
  public async handleCancelPost(chatId: number) {
    const currentPostData = this.adminPostData.get(chatId);
    if (currentPostData?.image) {
      fs.unlink(currentPostData.image, (err) => {
        if (err) console.error('Failed to delete temp file:', err);
      });
    }

    this.adminPostData.delete(chatId);
    this.userHandler.sendMainMenu(chatId);
  }
}
