import { Request, Response, NextFunction } from 'express';
import { logCheckIn } from './checkins.service';
import { AppError } from '../../middleware/errorHandler';

export async function logCheckInHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const habitId = req.params.habitId || req.body.habitId;
    if (!habitId) {
      throw new AppError(400, 'MISSING_HABIT_ID', 'Habit ID must be provided');
    }

    // Acting user's timezone resolved strictly from stored user profile
    const result = await logCheckIn(req.user.id, req.user.timezone, habitId, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}
