import { z } from 'zod';

export const createHabitSchema = z.object({
  name: z
    .string({ required_error: 'Habit name is required' })
    .trim()
    .min(1, 'Habit name cannot be empty')
    .max(100, 'Habit name must not exceed 100 characters'),
});

export type CreateHabitInput = z.infer<typeof createHabitSchema>;
