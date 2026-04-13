import { Router } from 'express';
import {
  createCustomerSource,
  deleteCustomerSource,
  listCustomerSources,
  updateCustomerSource,
} from '../controllers/customerSources.controller';

const customerSourcesRouter = Router();

customerSourcesRouter.get('/', listCustomerSources);
customerSourcesRouter.post('/', createCustomerSource);
customerSourcesRouter.put('/:id', updateCustomerSource);
customerSourcesRouter.delete('/:id', deleteCustomerSource);

export default customerSourcesRouter;
