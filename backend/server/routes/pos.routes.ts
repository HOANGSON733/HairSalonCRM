import { Router } from 'express';
import { checkoutPosOrder } from '../controllers/pos.controller';

const posRouter = Router();

posRouter.post('/checkout', checkoutPosOrder);

export default posRouter;

