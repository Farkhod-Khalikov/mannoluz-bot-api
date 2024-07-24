import { Router } from 'express';
import UserController from '../controllers/UserController';

const router = Router();


router.patch('/balance/add', UserController.addBonuses);  // Renamed route to add bonuses
router.patch('/balance/remove', UserController.removeBonuses);  // Renamed route to remove bonuses

export default router;