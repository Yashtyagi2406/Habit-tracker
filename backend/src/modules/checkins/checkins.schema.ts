import { z } from 'zod';
import { isValidLocalDateString } from '../../lib/localDate';

export const logCheckInSchema = z.object({
  habitId: z.string().uuid('Invalid habit ID format').optional(),
  date: z
    .string()
    .refine((d) => isValidLocalDateString(d), {
      message: 'Date must be a valid ISO-8601 calendar date in YYYY-MM-DD format',
    })
    .optional(),
});

export const habitCheckInParamSchema = z.object({
  habitId: z.string().min(1, 'Habit ID is required'),
});

export type LogCheckInInput = z.infer<typeof logCheckInSchema>;
