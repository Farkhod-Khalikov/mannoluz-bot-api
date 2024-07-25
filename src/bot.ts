import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import { initDB } from "./db";
import express from "express";
import MessageHandler from "./eventHandlers/MessageHandler";
import userRoute from "./routes/user.routes";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use('/users', userRoute);


app.get("/", (req, res) => {
  res.send("Express server is running");
});

app.listen(port, () => {
  console.log(`[SUCCESS] Express server is running`);
})

const token = process.env.TOKEN || "";
const bot = new TelegramBot(token, { polling: true });
if (!bot) console.log("[FAILED] Bot is not initialized.");
console.log("[SUCCESS] Bot is started.");
initDB();

const messageHandler = new MessageHandler(bot);

bot.on("message", (msg) => messageHandler.handleMessage(msg));
bot.on("callback_query", (callbackQuery) =>
  messageHandler.handleCallbackQuery(callbackQuery)
);
