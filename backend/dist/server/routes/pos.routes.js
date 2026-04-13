"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pos_controller_1 = require("../controllers/pos.controller");
const posRouter = (0, express_1.Router)();
posRouter.post('/checkout', pos_controller_1.checkoutPosOrder);
exports.default = posRouter;
//# sourceMappingURL=pos.routes.js.map