// src/tests/transaction.service.test.ts
import TransactionService from "../services/transaction.service";
import Transaction from "../models/transactions.schema";

// Mock the Transaction model
jest.mock("../models/transactions.schema");

describe('TransactionService', () => {
  describe('isDuplicated', () => {
    it('should return true if a transaction with the given uniqueId exists', async () => {
      // Arrange
      const uniqueId = '5';
      // Mock the findOne method to return a transaction
      (Transaction.findOne as jest.Mock).mockResolvedValue({ uniqueId });

      // Act
      const result = await TransactionService.isDuplicated(uniqueId);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false if no transaction with the given uniqueId exists', async () => {
      // Arrange
      const uniqueId = '5';
      // Mock the findOne method to return null
      (Transaction.findOne as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await TransactionService.isDuplicated(uniqueId);

      // Assert
      expect(result).toBe(false);
    });
  });
});
