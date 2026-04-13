import { Router } from 'express';
import { login, me } from '../controllers/auth.controller';

const authRouter = Router();

authRouter.post('/login', login);
authRouter.get('/me', me);

export default authRouter;
