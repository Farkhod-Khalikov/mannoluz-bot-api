import Product from "../models/products.schema";
import ProductService from "../services/product.service";

// mock the module
jest.mock("../models/products.schema");

describe("ProductService", () => {
  describe("retrieve", () => {
    it("should retrieve product if uniqueId is specified", async () => {
      const uniqueId = "someUniqueId";
      const mockProduct = { uniqueId, name: "Product1", price: 100 };

      // Mock the Product.findOne method to return the mockProduct
      (Product.findOne as jest.Mock).mockResolvedValue(mockProduct);

      // Call the retrieve method
      const result = await ProductService.retrieve(uniqueId);

      // Assertions
      expect(Product.findOne).toHaveBeenCalledWith({ uniqueId });
      expect(result).toEqual(mockProduct);
    });

    it("should retrieve all products if uniqueId is not specified", async () => {
      const mockProducts = [
        { uniqueId: "id1", name: "Product1", price: 100 },
        { uniqueId: "id2", name: "Product2", price: 200 },
      ];

      // Mock the Product.find method to return mockProducts
      (Product.find as jest.Mock).mockResolvedValue(mockProducts);

      // Call the retrieve method without a uniqueId
      const result = await ProductService.retrieve();

      // Assertions
      expect(Product.find).toHaveBeenCalledWith({});
      expect(result).toEqual(mockProducts);
    });

    it("should throw an error if there is an issue during retrieval", async () => {
      const errorMessage = "Error in Product.retrieve()";

      // Mock the Product.findOne method to throw an error
      (Product.findOne as jest.Mock).mockRejectedValue(new Error(errorMessage));

      // Assertions
      await expect(ProductService.retrieve("someUniqueId")).rejects.toThrow(
        errorMessage
      );
    });
  });
});
