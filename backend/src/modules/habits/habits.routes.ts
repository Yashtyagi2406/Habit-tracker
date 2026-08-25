import { Router } from 'express';
import { createHabitHandler, listHabitsHandler } from './habits.controller';
import { logCheckInHandler } from '../checkins/checkins.controller';
import { createHabitSchema } from './habits.schema';
import { logCheckInSchema } from '../checkins/checkins.schema';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth';

const router = Router();

router.use(requireAuth);

router.post('/', validate(createHabitSchema), createHabitHandler);
router.get('/', listHabitsHandler);
router.post('/:habitId/checkins', validate(logCheckInSchema), logCheckInHandler);

export const habitRoutes = router;
