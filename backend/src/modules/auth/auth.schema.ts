import { z } from 'zod';
import { isValidIanaTimezone } from '../../lib/localDate';

export const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters'),
  timezone: z
    .string({ required_error: 'Timezone is required' })
    .trim()
    .refine((tz) => isValidIanaTimezone(tz), {
      message: 'Invalid IANA timezone identifier (e.g. "Asia/Kolkata", "America/New_York")',
    }),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
