import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  preferred_currency: z.string().optional(),
  created_at: z.string()
});

export const ShiftSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  platform_account_id: z.string().nullable(),
  start_time: z.string(),
  end_time: z.string().nullable(),
  starting_mileage: z.number(),
  ending_mileage: z.number().nullable(),
  status: z.enum(['active', 'paused', 'completed'])
});

// more Supabase schemas are added as needed
