import { Router } from 'express';
import UserController from '../controllers/UserController';

const userRoute = Router();


userRoute.patch('/balance/add', UserController.addBonuses);  // Renamed route to add bonuses
userRoute.patch('/balance/remove', UserController.removeBonuses);  // Renamed route to remove bonuses

export default userRoute;