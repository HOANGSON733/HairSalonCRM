"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const appointments_controller_1 = require("../controllers/appointments.controller");
const appointmentsRouter = (0, express_1.Router)();
appointmentsRouter.get('/', appointments_controller_1.listAppointments);
appointmentsRouter.post('/', appointments_controller_1.createAppointment);
appointmentsRouter.put('/:id', appointments_controller_1.updateAppointment);
appointmentsRouter.delete('/:id', appointments_controller_1.deleteAppointment);
exports.default = appointmentsRouter;
//# sourceMappingURL=appointments.routes.js.map