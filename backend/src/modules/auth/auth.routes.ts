import { Router } from 'express';
import { registerHandler, loginHandler, getMeHandler } from './auth.controller';
import { registerSchema, loginSchema } from './auth.schema';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth';

const router = Router();

router.post('/register', validate(registerSchema), registerHandler);
router.post('/login', validate(loginSchema), loginHandler);
router.get('/me', requireAuth, getMeHandler);

export const authRoutes = router;
