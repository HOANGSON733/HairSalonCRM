import { Router } from 'express';
import { createEmployee, deleteEmployee, listEmployees, terminateEmployee, updateEmployee } from '../controllers/employees.controller';

const employeesRouter = Router();

employeesRouter.get('/', listEmployees);
employeesRouter.post('/', createEmployee);
employeesRouter.put('/:id', updateEmployee);
employeesRouter.patch('/:id/terminate', terminateEmployee);
employeesRouter.delete('/:id', deleteEmployee);

export default employeesRouter;
