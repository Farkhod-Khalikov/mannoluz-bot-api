import { Router } from "express";
import UserController from "../controllers/UserController";

const userRouter = Router();

userRouter.patch("/balance/add", UserController.addBonuses); // Renamed route to add bonuses
userRouter.patch("/balance/remove", UserController.removeBonuses); // Renamed route to remove bonuses
userRouter.patch("/admin-privileges/add", UserController.addAdmin);
userRouter.patch("/admin-privileges/remove", UserController.removeAdmin);

export default userRouter;
