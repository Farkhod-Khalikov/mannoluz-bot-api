import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import { initDB } from "./db";
import express from "express";
import MessageHandler from "./eventHandlers/MessageHandler";
import userRouter from "./routes/user.routes";
// import productRouter from "./routes/product.routes";
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// routes
app.use("/users", userRouter);
// app.use("erproducts", productRouter);

app.listen(port, () => {
  console.log(`[SUCCESS] Express server is running`);
});

const token = process.env.TOKEN || "";
const bot = new TelegramBot(token, { polling: true });

if (!bot) console.log("[FAILED] Bot is not initialized.");
console.log("[SUCCESS] Bot is started.");

// initialize Database
initDB();

const messageHandler = new MessageHandler(bot);

bot.on("message", (msg) => messageHandler.handleMessage(msg));
bot.on("callback_query", (callbackQuery) =>
  messageHandler.handleCallbackQuery(callbackQuery)
);
