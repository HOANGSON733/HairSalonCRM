import { Router } from 'express';
import { createEmployee, deleteEmployee, getEmployeeProfileStats, listEmployees, terminateEmployee, updateEmployee } from '../controllers/employees.controller';

const employeesRouter = Router();

employeesRouter.get('/', listEmployees);
employeesRouter.get('/:id/salary', getEmployeeProfileStats);
employeesRouter.post('/', createEmployee);
employeesRouter.put('/:id', updateEmployee);
employeesRouter.patch('/:id/terminate', terminateEmployee);
employeesRouter.delete('/:id', deleteEmployee);

export default employeesRouter;
