import { Router } from 'express';
import { createHabitHandler, listHabitsHandler } from './habits.controller';
import { createHabitSchema } from './habits.schema';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth';

const router = Router();

router.use(requireAuth);

router.post('/', validate(createHabitSchema), createHabitHandler);
router.get('/', listHabitsHandler);

export const habitRoutes = router;
