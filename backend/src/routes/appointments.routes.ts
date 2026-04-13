import { Router } from 'express';
import { createAppointment, deleteAppointment, listAppointments, updateAppointment } from '../controllers/appointments.controller';

const appointmentsRouter = Router();

appointmentsRouter.get('/', listAppointments);
appointmentsRouter.post('/', createAppointment);
appointmentsRouter.put('/:id', updateAppointment);
appointmentsRouter.delete('/:id', deleteAppointment);

export default appointmentsRouter;
