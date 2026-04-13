"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customers_controller_1 = require("../controllers/customers.controller");
const customersRouter = (0, express_1.Router)();
customersRouter.get('/', customers_controller_1.listCustomers);
customersRouter.post('/', customers_controller_1.createCustomer);
exports.default = customersRouter;
//# sourceMappingURL=customers.routes.js.map