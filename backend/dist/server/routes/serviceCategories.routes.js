"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const serviceCategories_controller_1 = require("../controllers/serviceCategories.controller");
const serviceCategoriesRouter = (0, express_1.Router)();
serviceCategoriesRouter.get('/', serviceCategories_controller_1.listServiceCategories);
serviceCategoriesRouter.post('/', serviceCategories_controller_1.createServiceCategory);
serviceCategoriesRouter.put('/:id', serviceCategories_controller_1.updateServiceCategory);
serviceCategoriesRouter.delete('/:id', serviceCategories_controller_1.deleteServiceCategory);
exports.default = serviceCategoriesRouter;
//# sourceMappingURL=serviceCategories.routes.js.map