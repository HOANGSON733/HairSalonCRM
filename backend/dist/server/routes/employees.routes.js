"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const employees_controller_1 = require("../controllers/employees.controller");
const employeesRouter = (0, express_1.Router)();
employeesRouter.get('/', employees_controller_1.listEmployees);
employeesRouter.post('/', employees_controller_1.createEmployee);
employeesRouter.put('/:id', employees_controller_1.updateEmployee);
employeesRouter.patch('/:id/terminate', employees_controller_1.terminateEmployee);
employeesRouter.delete('/:id', employees_controller_1.deleteEmployee);
exports.default = employeesRouter;
//# sourceMappingURL=employees.routes.js.map