import { Router } from 'express';
import UserController from '../controllers/UserController';

const router = Router();

router.post('/', UserController.addUser);
router.delete('/:id', UserController.deleteUser);
router.put('/:id', UserController.updateUser);
router.patch('/:id/amount_number', UserController.updateUserBalance); // New route for updating balance

export default router;
