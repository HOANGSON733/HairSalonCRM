"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customerSources_controller_1 = require("../controllers/customerSources.controller");
const customerSourcesRouter = (0, express_1.Router)();
customerSourcesRouter.get('/', customerSources_controller_1.listCustomerSources);
customerSourcesRouter.post('/', customerSources_controller_1.createCustomerSource);
customerSourcesRouter.put('/:id', customerSources_controller_1.updateCustomerSource);
customerSourcesRouter.delete('/:id', customerSources_controller_1.deleteCustomerSource);
exports.default = customerSourcesRouter;
//# sourceMappingURL=customerSources.routes.js.map