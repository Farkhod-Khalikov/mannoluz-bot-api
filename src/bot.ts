import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import { initDB } from "./db";
import MessageController from "./controllers/MessageController";
import MessageHandler from "./event-handlers/MessageHandler";
// import CallbackQueryController from "./controllers/CallbackQueryController";

dotenv.config();

const token = process.env.TOKEN || "";
const bot = new TelegramBot(token, { polling: true });
if (!bot) console.log("[FAILED] Bot is not initialized.");
console.log("[SUCCESS] Bot is started.");
initDB();

const messageHandler = new MessageHandler(bot);
// const messageController = new MessageController(bot);
// const callbackQueryController = new CallbackQueryController(bot);

bot.on("message", (msg) => messageHandler.handleMessage(msg));
bot.on("callback_query", (callbackQuery) =>
  messageHandler.handleCallbackQuery(callbackQuery)
);
