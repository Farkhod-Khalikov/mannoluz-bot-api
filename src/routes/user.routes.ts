import { Router } from "express";
import UserController from "../controllers/UserController";

const userRouter = Router();

userRouter.patch("/balance/add", UserController.addBonuses); 
userRouter.patch("/balance/remove", UserController.removeBonuses); 
userRouter.patch("/admin-privileges/add", UserController.addAdmin);
userRouter.patch("/admin-privileges/remove", UserController.removeAdmin);

export default userRouter;
