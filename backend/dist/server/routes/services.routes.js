"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const services_controller_1 = require("../controllers/services.controller");
const servicesRouter = (0, express_1.Router)();
servicesRouter.get('/', services_controller_1.listServices);
servicesRouter.post('/', services_controller_1.createService);
servicesRouter.put('/:id', services_controller_1.updateService);
servicesRouter.delete('/:id', services_controller_1.deleteService);
exports.default = servicesRouter;
//# sourceMappingURL=services.routes.js.map