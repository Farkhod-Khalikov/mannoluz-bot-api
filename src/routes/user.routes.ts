import { Router } from "express";
import UserController from "../controllers/UserController";

const userRouter = Router();

// balance
userRouter.patch("/balance/add", UserController.addBonuses);
userRouter.patch("/balance/remove", UserController.removeBonuses);

// admin-privileges
userRouter.patch("/admin-privileges/add", UserController.addAdmin);
userRouter.patch("/admin-privileges/remove", UserController.removeAdmin);

export default userRouter;
