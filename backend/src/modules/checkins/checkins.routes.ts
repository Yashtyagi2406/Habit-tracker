import { Router } from 'express';
import { logCheckInHandler } from './checkins.controller';
import { logCheckInSchema } from './checkins.schema';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth';

const router = Router();

router.use(requireAuth);

// Supports POST /api/checkins (with { habitId, date? } in body)
router.post('/', validate(logCheckInSchema), logCheckInHandler);

// Supports POST /api/checkins/:habitId (with optional { date } in body)
router.post('/:habitId', validate(logCheckInSchema), logCheckInHandler);

export const checkInRoutes = router;
