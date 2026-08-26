import { z } from 'zod';

export const createHabitSchema = z.object({
  name: z
    .string({ required_error: 'Habit name is required' })
    .trim()
    .min(1, 'Habit name cannot be empty')
    .max(100, 'Habit name must not exceed 100 characters'),
  description: z
    .string()
    .trim()
    .max(500, 'Description must not exceed 500 characters')
    .optional(),
});

export type CreateHabitInput = z.infer<typeof createHabitSchema>;
