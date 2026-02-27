import { z } from 'zod';

export const registerSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(50).optional(),
});
