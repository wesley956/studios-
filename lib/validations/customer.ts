import { z } from 'zod';

export const customerSchema = z.object({
  businessId: z.string().uuid(),
  fullName: z.string().min(3),
  phone: z.string().min(10),
  birthday: z.string().optional(),
  notes: z.string().optional()
});
