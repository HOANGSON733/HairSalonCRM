import { Router } from 'express';
import {
  createProductCategory,
  deleteProductCategory,
  listProductCategories,
  updateProductCategory,
} from '../controllers/productCategories.controller.ts';

const productCategoriesRouter = Router();

productCategoriesRouter.get('/', listProductCategories);
productCategoriesRouter.post('/', createProductCategory);
productCategoriesRouter.put('/:id', updateProductCategory);
productCategoriesRouter.delete('/:id', deleteProductCategory);

export default productCategoriesRouter;
