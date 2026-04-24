import { z } from 'zod';

export const businessSchema = z.object({
  ownerId: z.string().uuid(),
  businessName: z.string().min(2),
  slug: z.string().min(2),
  city: z.string().optional(),
  whatsapp: z.string().optional(),
  instagram: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  planName: z.string().default('start'),
  status: z.enum(['trial', 'active', 'blocked']).default('trial')
});
