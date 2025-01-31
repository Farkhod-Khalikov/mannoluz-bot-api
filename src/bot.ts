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
// const userController = new UserController(bot);
// const productController = new ProductController();
const messageHandler = new MessageHandler(bot);

// Express initialization
const app = express();
app.use(express.json());

// -- ROUTES --
// Bonuses
app.post("/users/balance/bonuses/add", (req, res) => UserController.addBonuses(req, res, bot));
app.post("/users/balance/bonuses/remove", (req, res) => UserController.removeBonuses(req, res, bot));

// Money
app.post("/users/balance/money/add", (req, res) => UserController.addMoney(req, res,bot));
app.post("/users/balance/money/remove", (req, res) => UserController.removeMoney(req, res,bot));
app.post("/users/balance/money/refund-product", (req, res) => UserController.removeMoney(req, res,bot));
app.post("/users/balance/money/refund-payment", (req, res) => UserController.removeMoney(req, res,bot));

// Admin privileges routes
app.post("/users/admin-privileges/add", (req, res) => UserController.addAdmin(req, res,bot));
app.post("/users/admin-privileges/remove", (req, res) => UserController.removeAdmin(req, res,bot));
app.post("/users/sudo-privileges/add", (req, res) => UserController.addSudo(req, res,bot));
app.post("/users/sudo-privileges/remove", (req, res) => UserController.removeSudo(req, res,bot));

// Transactions routes
app.post("/users/transactions/bonuses/remove", (req, res) =>
  UserController.removeBonusesTransaction(req, res,bot),
);

app.post("/users/transactions/money/remove", (req, res) =>
  UserController.removeMoneyTransaction(req, res, bot),
);

// Purchase requests routes
app.post("/users/purchase-requests/update", (req, res) =>
  UserController.updateRequestStatus(req, res,bot),
);

// Products routes
app.post("/products/add", (req, res) => ProductController.addProduct(req, res));
app.post("/products/remove", (req, res) => ProductController.removeProduct(req, res));

// start listening on port
app.listen(port, () => {
  console.log(`[SUCCESS] Express server is running on port ${port}`);
});

// Handle Incoming Message and callback data
bot.on("message", (msg) => messageHandler.handleMessage(msg));
bot.on("callback_query", (callback) => messageHandler.handleCallbackData(callback));
