import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  listProducts,
  restockProduct,
  updateProduct,
} from '../controllers/products.controller';

const productsRouter = Router();

productsRouter.get('/', listProducts);
productsRouter.post('/', createProduct);
productsRouter.put('/:id', updateProduct);
productsRouter.delete('/:id', deleteProduct);
productsRouter.post('/:id/restock', restockProduct);

export default productsRouter;
