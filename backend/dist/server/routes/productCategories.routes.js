"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productCategories_controller_1 = require("../controllers/productCategories.controller");
const productCategoriesRouter = (0, express_1.Router)();
productCategoriesRouter.get('/', productCategories_controller_1.listProductCategories);
productCategoriesRouter.post('/', productCategories_controller_1.createProductCategory);
productCategoriesRouter.put('/:id', productCategories_controller_1.updateProductCategory);
productCategoriesRouter.delete('/:id', productCategories_controller_1.deleteProductCategory);
exports.default = productCategoriesRouter;
//# sourceMappingURL=productCategories.routes.js.map