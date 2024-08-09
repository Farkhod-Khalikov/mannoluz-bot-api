import {Router} from "express";
import ProductController from "../controllers/ProductController";

const productRouter = Router();

productRouter.post("/add", ProductController.addProduct); // add a new product to products
productRouter.post("/update", ProductController.updateProduct);
productRouter.post("/remove", ProductController.removeProduct);

export default productRouter;
