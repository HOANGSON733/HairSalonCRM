import { Router } from 'express';
import { createCustomer, listCustomers } from '../controllers/customers.controller';

const customersRouter = Router();

customersRouter.get('/', listCustomers);
customersRouter.post('/', createCustomer);

export default customersRouter;
