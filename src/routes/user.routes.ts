import { Router } from 'express';
import UserController from '../controllers/UserController';

const userRouter = Router();


userRouter.patch('/balance/add', UserController.addBonuses);  // Renamed route to add bonuses
userRouter.patch('/balance/remove', UserController.removeBonuses);  // Renamed route to remove bonuses

export default userRouter;