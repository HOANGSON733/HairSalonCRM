import { Router } from 'express';
import { createCustomer, deleteCustomer, listCustomers, updateCustomer } from '../controllers/customers.controller';

const customersRouter = Router();

customersRouter.get('/', listCustomers);
customersRouter.post('/', createCustomer);
customersRouter.put('/:id', updateCustomer);
customersRouter.delete('/:id', deleteCustomer);

export default customersRouter;
