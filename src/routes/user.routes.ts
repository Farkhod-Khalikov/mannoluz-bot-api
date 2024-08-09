import { Router } from "express";
import UserController from "../controllers/UserController";

const userRouter = Router();

// balance
userRouter.post("/balance/add", UserController.addBonuses);
userRouter.post("/balance/remove", UserController.removeBonuses);

// admin-privileges
userRouter.post("/admin-privileges/add", UserController.addAdmin);
userRouter.post("/admin-privileges/remove", UserController.removeAdmin);

export default userRouter;
