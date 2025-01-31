// env
import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "/../.env" });

// imports
import TelegramBot from "node-telegram-bot-api";
import { initDB } from "./db";
import express from "express";
import MessageHandler from "./event-handlers/message.handler";
import UserController from "./controllers/user.controller";
import ProductController from "./controllers/product.controller";

// environment variables
const port = process.env.PORT || 4000;
const MONGO = process.env.MONGO || "";
const token = process.env.TOKEN || "";

// BOT initialization
const bot = new TelegramBot(token, { polling: true });

if (!bot) console.log("[FAILED] Bot is not initialized.");

// SUCCESS if BOT is created
console.log("[SUCCESS] Bot is started.");

// Database initialization
initDB(MONGO);

//Controllers and Handlers
const userController = new UserController(bot);
const productController = new ProductController();
const messageHandler = new MessageHandler(bot);

// Express initialization
const app = express();
app.use(express.json());

// -- ROUTES --
// Bonuses
app.post("/users/balance/bonuses/add", (req, res) => userController.addBonuses(req, res));
app.post("/users/balance/bonuses/remove", (req, res) => userController.removeBonuses(req, res));

// Money
app.post("/users/balance/money/add", (req, res) => userController.addMoney(req, res));
app.post("/users/balance/money/remove", (req, res) => userController.removeMoney(req, res));
app.post("/users/balance/money/refund-product", (req, res) => userController.removeMoney(req, res));
app.post("/users/balance/money/refund-payment", (req, res) => userController.removeMoney(req, res));

// Admin privileges routes
app.post("/users/admin-privileges/add", (req, res) => userController.addAdmin(req, res));
app.post("/users/admin-privileges/remove", (req, res) => userController.removeAdmin(req, res));
app.post("/users/sudo-privileges/add", (req, res) => userController.addSudo(req, res));
app.post("/users/sudo-privileges/remove", (req, res) => userController.removeSudo(req, res));

// Transactions routes
app.post("/users/transactions/bonuses/remove", (req, res) =>
  userController.removeBonusesTransaction(req, res),
);

app.post("/users/transactions/money/remove", (req, res) =>
  userController.removeMoneyTransaction(req, res),
);

// Purchase requests routes
app.post("/users/purchase-requests/update", (req, res) =>
  userController.updateRequestStatus(req, res),
);

// Products routes
app.post("/products/add", (req, res) => productController.addProduct(req, res));
app.post("/products/remove", (req, res) => productController.removeProduct(req, res));

// start listening on port
app.listen(port, () => {
  console.log(`[SUCCESS] Express server is running on port ${port}`);
});

// Handle Incoming Message and callback data
bot.on("message", (msg) => messageHandler.handleMessage(msg));
bot.on("callback_query", (callback) => messageHandler.handleCallbackData(callback));
