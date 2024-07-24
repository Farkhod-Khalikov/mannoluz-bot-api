import TelegramBot from "node-telegram-bot-api";
import { UserService } from "../services/UserService";
import i18n from "../utils/i18n";
import fs from "fs";
import path from "path";
import Post from "../models/posts"; // Import the Post model

export default class AdminHandler {
  private bot: TelegramBot;
  private adminPostData: Map<
    number,
    { title: string | null; message: string | null; image: string | null }
  > = new Map();

  private tempDir: string;

  constructor(bot: TelegramBot) {
    this.bot = bot;
    this.tempDir = path.join(__dirname, "..", "temp/admin-posts"); // Ensure temp folder is created
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir);
    }
  }

  public async handleSendPost(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;

    this.bot.sendMessage(chatId, i18n.t("provide_post_title"), {
      reply_markup: {
        force_reply: true,
      },
    });

    this.adminPostData.set(chatId, { title: null, message: null, image: null });
  }

  public async handleAdminPostData(chatId: number, text: string) {
    const currentPostData = this.adminPostData.get(chatId);

    if (currentPostData) {
      if (!currentPostData.title) {
        currentPostData.title = text;
        this.bot.sendMessage(chatId, i18n.t("provide_post_message"), {
          reply_markup: {
            force_reply: true,
          },
        });
      } else if (!currentPostData.message) {
        currentPostData.message = text;
        this.bot.sendMessage(chatId, i18n.t("provide_post_image"), {
          reply_markup: {
            force_reply: true,
          },
        });
      } else if (!currentPostData.image) {
        // Await for image file
        this.bot.sendMessage(chatId, i18n.t("uploading_image"), {
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
      const filePath = await this.bot.downloadFile(fileId, this.tempDir);
      const fileName = path.basename(filePath);

      // Update post data with the local image path
      const currentPostData = this.adminPostData.get(chatId);
      if (currentPostData) {
        currentPostData.image = filePath;

        const postSummary = `
*Title:* ${currentPostData.title}

*Message:* ${currentPostData.message}
        `;
        this.bot.sendPhoto(chatId, filePath, {
          caption: postSummary,
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: i18n.t("confirm_button"),
                  callback_data: "confirm_post",
                },
              ],
              [
                {
                  text: i18n.t("btn_cancel_post_creation"),
                  callback_data: "cancel_post",
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
      // Save post data to the database
      const adminName = await UserService.getAdminName(chatId); // Assuming you have a method to get admin name
      const post = new Post({
        adminName,
        title: postData.title,
        createdAt: new Date(),
        imagePath: postData.image,
      });
      await post.save();

      // Send post to all users
      const users = await UserService.getAllUsers();
      for (const user of users) {
        this.bot.sendPhoto(user.chatId, postData.image, {
          caption: `*${postData.title}*\n\n${postData.message}`,
          parse_mode: "Markdown",
        });
      }
      this.bot.sendMessage(chatId, i18n.t("post_sent"));
      this.sendMainMenu(chatId);
    }
    // Only clean up temp files if the post is canceled
    // this.cleanUpTempFiles();
    this.adminPostData.delete(chatId);
  }

  public async handleCancelPost(chatId: number) {
    const currentPostData = this.adminPostData.get(chatId);
    if (currentPostData && currentPostData.image) {
      // Remove the image file if the post is canceled
      fs.unlink(currentPostData.image, (err) => {
        if (err) {
          console.error("Failed to delete temp file:", err);
        }
      });
    }
    this.adminPostData.delete(chatId);
    this.sendMainMenu(chatId);
  }

  public async sendMainMenu(chatId: number) {
    const user = await UserService.findUserByChatId(chatId);
    const isAdmin = user && (await UserService.isUserAdmin(chatId));

    const mainMenuKeyboard = [
      [{ text: i18n.t("credit_card_button") }],
      [
        { text: i18n.t("settings_button") },
        { text: i18n.t("btn_list_products") },
      ],
      [
        { text: i18n.t("contact_us_button") },
        { text: i18n.t("about_us_button") },
      ],
    ];

    if (isAdmin) {
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
}
