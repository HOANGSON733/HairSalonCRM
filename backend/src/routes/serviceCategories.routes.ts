import { Router } from 'express';
import {
  createServiceCategory,
  deleteServiceCategory,
  listServiceCategories,
  updateServiceCategory,
} from '../controllers/serviceCategories.controller';

const serviceCategoriesRouter = Router();

serviceCategoriesRouter.get('/', listServiceCategories);
serviceCategoriesRouter.post('/', createServiceCategory);
serviceCategoriesRouter.put('/:id', updateServiceCategory);
serviceCategoriesRouter.delete('/:id', deleteServiceCategory);

export default serviceCategoriesRouter;
