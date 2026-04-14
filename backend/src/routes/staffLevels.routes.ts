import { Router } from 'express';
import { createStaffLevel, deleteStaffLevel, listStaffLevels, updateStaffLevel } from '../controllers/staffLevels.controller';

const staffLevelsRouter = Router();

staffLevelsRouter.get('/', listStaffLevels);
staffLevelsRouter.post('/', createStaffLevel);
staffLevelsRouter.put('/:id', updateStaffLevel);
staffLevelsRouter.delete('/:id', deleteStaffLevel);

export default staffLevelsRouter;
