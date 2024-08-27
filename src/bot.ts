import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "/../.env" });

import TelegramBot from "node-telegram-bot-api";
import { initDB } from "./db";
import express from "express";
import MessageHandler from "./eventHandlers/MessageHandler";
import UserController from "./controllers/UserController";
import ProductController from "./controllers/ProductController";
// import userRouter from "./routes/user.routes";
// import productRouter from "./routes/product.routes";

// environment variables
const port = process.env.PORT || 4000;
const MONGO = process.env.MONGO || "";
const token = process.env.TOKEN || "";

// init BOT
const bot = new TelegramBot(token, { polling: true });
//Controllers and Handlers
const userController = new UserController(bot);
const productController = new ProductController(bot);
const messageHandler = new MessageHandler(bot);

// Database initialization
initDB(MONGO);

// EXPRESS initialization
const app = express();
app.use(express.json());

// if bot not initialized log the error
if (!bot) console.log("[FAILED] Bot is not initialized.");
// SUCCESS if BOT is created
console.log("[SUCCESS] Bot is started.");

// routes
// balance routes
app.post("/users/balance/add", (req, res) =>
  userController.addBonuses(req, res)
);
app.post("/users/balance/remove", (req, res) =>
  userController.removeBonuses(req, res)
);

// Admin privileges routes
app.post("/users/admin-privileges/add", (req, res) =>
  userController.addAdmin(req, res)
);
app.post("/users/admin-privileges/remove", (req, res) =>
  userController.removeAdmin(req, res)
);

// Transactions routes
app.post("/users/transactions/remove", (req, res) =>
  userController.removeTransaction(req, res)
);

// Purchase requests routes
app.post("/users/purchase-requests/update", (req, res) =>
  userController.updateRequestStatus(req, res)
);

// Products routes
app.post("/products/add", (req, res) => productController.addProduct(req, res));
app.post("/products/remove", (req, res) =>
  productController.removeProduct(req, res)
);

// app.use("/users", userRouter);
// app.use("/products", productRouter);

app.listen(port, () => {
  console.log(`[SUCCESS] Express server is running on port ${port}`);
});

bot.on("message", (msg) => messageHandler.handleMessage(msg));
bot.on("callback_query", (callbackQuery) =>
  messageHandler.handleCallbackQuery(callbackQuery)
);
