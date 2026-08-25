import { Request, Response, NextFunction } from 'express';
import { createHabit, listUserHabits } from './habits.service';
import { AppError } from '../../middleware/errorHandler';

export async function createHabitHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }
    const habit = await createHabit(req.user.id, req.body);
    res.status(201).json({ habit });
  } catch (error) {
    next(error);
  }
}

export async function listHabitsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }
    // Timezone resolved strictly from stored user profile
    const habits = await listUserHabits(req.user.id, req.user.timezone);
    res.status(200).json({ habits });
  } catch (error) {
    next(error);
  }
}
