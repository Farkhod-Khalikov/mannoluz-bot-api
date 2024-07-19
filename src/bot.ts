import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import { initDB } from "./db";
import MessageController from "./controllers/MessageController";
// import CallbackQueryController from "./controllers/CallbackQueryController";

dotenv.config();

const token = process.env.TOKEN || "";
const bot = new TelegramBot(token, { polling: true });

initDB();

const messageController = new MessageController(bot);
// const callbackQueryController = new CallbackQueryController(bot);

bot.on("message", (msg) => messageController.handleMessage(msg));

// bot.on("callback_query", (callbackQuery) =>
//   callbackQueryController.handleCallbackQuery(callbackQuery)
// );
