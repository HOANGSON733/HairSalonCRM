import { Router } from 'express';
import { checkoutPosOrder } from '../controllers/pos.controller.ts';

const posRouter = Router();

posRouter.post('/checkout', checkoutPosOrder);

export default posRouter;

