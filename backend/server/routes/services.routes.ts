import { Router } from 'express';
import {
  createService,
  deleteService,
  listServices,
  updateService,
} from '../controllers/services.controller';

const servicesRouter = Router();

servicesRouter.get('/', listServices);
servicesRouter.post('/', createService);
servicesRouter.put('/:id', updateService);
servicesRouter.delete('/:id', deleteService);

export default servicesRouter;

