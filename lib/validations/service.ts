import { z } from 'zod';

export const serviceSchema = z.object({
  businessId: z.string().uuid(),
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  durationMinutes: z.coerce.number().int().min(5),
  category: z.string().optional(),
  isActive: z.union([z.string(), z.boolean()]).transform((val) => val === true || val === 'on')
});
