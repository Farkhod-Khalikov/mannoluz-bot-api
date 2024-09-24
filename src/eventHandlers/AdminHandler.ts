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
    this.tempDir = path.join(__dirname, '..', 'temp/admin-posts'); // Ensure temp folder is created
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir);
    }
  }

  public async handleSendPost(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;

    // Fetch admin name from user service
    const adminName = await UserService.getUserName(chatId);

    this.bot.sendMessage(chatId, i18n.t('provide_post_title'), {
      reply_markup: {
        force_reply: true,
      },
    });

    this.adminPostData.set(chatId, {
      adminName,
      title: null,
      message: null,
      image: null,
    });
  }

  public async handleAdminPostData(chatId: number, text: string) {
    const currentPostData = this.adminPostData.get(chatId);

    if (currentPostData) {
      if (!currentPostData.title) {
        currentPostData.title = text;
        this.bot.sendMessage(chatId, i18n.t('provide_post_message'), {
          reply_markup: {
            force_reply: true,
          },
        });
      } else if (!currentPostData.message) {
        currentPostData.message = text;
        this.bot.sendMessage(chatId, i18n.t('provide_post_image'), {
          reply_markup: {
            force_reply: true,
          },
        });
      } else if (!currentPostData.image) {
        currentPostData.image = text;
        this.bot.sendMessage(chatId, i18n.t('uploading_image'), {
          reply_markup: {
            force_reply: true,
          },
        });
      }
    }
  }

  public async handleImageUpload(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const photo = msg.photo ? msg.photo[msg.photo.length - 1] : null;

    if (photo) {
      const fileId = photo.file_id;
      const tempFilePath = await this.bot.downloadFile(fileId, this.tempDir);

      // Generate a unique ID for the post
      const uniqueId = uuidv4();

      // Get admin name from current post data
      const currentPostData = this.adminPostData.get(chatId);
      if (currentPostData) {
        const fileName = `${currentPostData.adminName}_${uniqueId}.png`;
        const newFilePath = path.join(this.tempDir, fileName);

        // Rename the file to the new format
        fs.rename(tempFilePath, newFilePath, (err) => {
          if (err) {
            console.error('Failed to rename temp file:', err);
          }
        });

        currentPostData.image = newFilePath;

        const postSummary = `
*Title:* ${currentPostData.title}

*Message:* ${currentPostData.message}
        `;
        this.bot.sendPhoto(chatId, newFilePath, {
          caption: postSummary,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: i18n.t('btn_confirm'),
                  callback_data: 'confirm_post',
                },
              ],
              [
                {
                  text: i18n.t('btn_cancel_post_creation'),
                  callback_data: 'cancel_post',
                },
              ],
            ],
          },
        });
      }
    }
  }

  public async handleConfirmPost(chatId: number) {
    const postData = this.adminPostData.get(chatId);
    if (postData && postData.title && postData.message && postData.image) {
      // Save post data to the database with the full image path
      const creator = await UserService.getUserName(chatId);
      const post = new Post({
        creator,
        title: postData.title,
        createdAt: new Date(),
        imagePath: postData.image, // Save the full path here
      });
      await post.save();

      // Send post to all users
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
    // Clean up temp files if the post is canceled
    this.adminPostData.delete(chatId);
  }

  public async handleCancelPost(chatId: number) {
    const currentPostData = this.adminPostData.get(chatId);
    if (currentPostData && currentPostData.image) {
      // Remove the image file if the post is canceled
      fs.unlink(currentPostData.image, (err) => {
        if (err) {
          console.error('Failed to delete temp file:', err);
        }
      });
    }
    this.adminPostData.delete(chatId);
    this.userHandler.sendMainMenu(chatId);
  }

  // public async sendMainMenu(chatId: number) {
  //   const user = await UserService.findUserByChatId(chatId);
  //   const isAdmin = user && (await UserService.isUserAdmin(chatId));
  //   const isSudo = user && (await user.isSudo);
  //   const mainMenuKeyboard = [
  //     [{ text: i18n.t('btn_credit_card') }],
  //     [{ text: i18n.t('btn_list_products') }, { text: i18n.t('btn_list_transactions') }],
  //     [{ text: i18n.t('btn_settings') }, { text: i18n.t('btn_purchase_request') }],
  //     // [{ text: i18n.t('btn_contact_us') }, { text: i18n.t('btn_about_us') }],
  //   ];
  //   const sudoAdminMenuKeyboard = [
  //     [
  //       {
  //         text: i18n.t('btn_send_post'),
  //       },
  //     ],
  //     [{ text: i18n.t('btn_add_admin') }, { text: i18n.t('btn_remove_admin') }],
  //     [{ text: i18n.t('btn_list_products') }, { text: i18n.t('btn_list_requests') }],
  //     [{ text: i18n.t('btn_settings') }, { text: i18n.t('btn_rules') }],
  //   ];
  //   const adminMenuKeyboard = [
  //     [
  //       {
  //         text: i18n.t('btn_send_post'),
  //       },
  //     ],
  //     [{ text: i18n.t('btn_list_products') }, { text: i18n.t('btn_list_requests') }],
  //     [{ text: i18n.t('btn_settings') }, { text: i18n.t('btn_rules') }],
  //   ];
  //   if (isSudo) {
  //     this.bot.sendMessage(chatId, i18n.t('choose_option'), {
  //       reply_markup: {
  //         keyboard: sudoAdminMenuKeyboard,
  //         resize_keyboard: true,
  //         one_time_keyboard: false,
  //       },
  //     });
  //   }
  //   if (isAdmin && !isSudo) {
  //     this.bot.sendMessage(chatId, i18n.t('choose_option'), {
  //       reply_markup: {
  //         keyboard: adminMenuKeyboard,
  //         resize_keyboard: true,
  //         one_time_keyboard: false,
  //       },
  //     });
  //   } else {
  //     this.bot.sendMessage(chatId, i18n.t('choose_option'), {
  //       reply_markup: {
  //         keyboard: mainMenuKeyboard,
  //         resize_keyboard: true,
  //         one_time_keyboard: false,
  //       },
  //     });
  //   }
  // }
  // public async handleAddAdmin(msg: TelegramBot.Message) {
  //   const chatId = msg.chat.id;

  //   this.bot.sendMessage(chatId, i18n.t('enter_phone_number'), {
  //     reply_markup: {
  //       force_reply: true,
  //     },
  //   });

  //   this.bot.onReplyToMessage(chatId, msg.message_id, async (replyMsg) => {
  //     const phoneNumber = replyMsg.text || '';
  //     const user = await UserService.findUserByphoneNumber(phoneNumber);

  //     if (user) {
  //       user.isAdmin = true;
  //       await user.save();
  //       this.bot.sendMessage(chatId, i18n.t('admin_added_success'));
  //     } else {
  //       this.bot.sendMessage(chatId, i18n.t('user_not_found'));
  //     }
  //   });
  // }

  // // Handle Remove Admin button click
  // public async handleRemoveAdmin(msg: TelegramBot.Message) {
  //   const chatId = msg.chat.id;

  //   this.bot.sendMessage(chatId, i18n.t('enter_phone_number'), {
  //     reply_markup: {
  //       force_reply: true,
  //     },
  //   });

  //   this.bot.onReplyToMessage(chatId, msg.message_id, async (replyMsg) => {
  //     const phoneNumber = replyMsg.text || '';
  //     const user = await UserService.findUserByphoneNumber(phoneNumber);

  //     if (user) {
  //       user.isAdmin = false;
  //       await user.save();
  //       this.bot.sendMessage(chatId, i18n.t('admin_removed_success'));
  //     } else {
  //       this.bot.sendMessage(chatId, i18n.t('user_not_found'));
  //     }
  //   });
  // }
}
