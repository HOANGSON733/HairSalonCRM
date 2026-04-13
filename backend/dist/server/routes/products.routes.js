"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const products_controller_1 = require("../controllers/products.controller");
const productsRouter = (0, express_1.Router)();
productsRouter.get('/', products_controller_1.listProducts);
productsRouter.post('/', products_controller_1.createProduct);
productsRouter.put('/:id', products_controller_1.updateProduct);
productsRouter.delete('/:id', products_controller_1.deleteProduct);
productsRouter.post('/:id/restock', products_controller_1.restockProduct);
exports.default = productsRouter;
//# sourceMappingURL=products.routes.js.map