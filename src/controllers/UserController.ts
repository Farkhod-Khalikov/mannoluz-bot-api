import { Request, Response } from 'express';
import { UserService } from '../services/UserService';

class UserController {
  static addUser(req: Request, res: Response) {
    // Add user logic will go here
    res.json({ message: 'User added' });
  }

  static deleteUser(req: Request, res: Response) {
    // Delete user logic will go here
    const { id } = req.params;
    res.json({ message: `User with ID ${id} deleted` });
  }

  static updateUser(req: Request, res: Response) {
    // Update user logic will go here
    const { id } = req.params;
    res.json({ message: `User with ID ${id} updated` });
  }
  static async updateUserBalance(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { amount_number } = req.body;

      if (!amount_number || isNaN(amount_number)) {
        return res.status(400).json({ message: 'Invalid amount_number provided' });
      }

      // Calculate 2% of amount_number
      const amountToAdd = amount_number * 0.02;

      // Find user by ID
      const user = await UserService.findUserByChatId(parseInt(id, 10));
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update user's balance
      user.balance = (user.balance || 0) + amountToAdd;
      await user.save();

      res.json({ message: 'User balance updated', newBalance: user.balance });
    } catch (error) {
      console.error('Error updating user balance:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}

export default UserController;
