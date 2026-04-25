import { z } from 'zod';

export const SINGLE_PLAN_KEY = 'unico';
export const SINGLE_PLAN_LABEL = 'Plano único';
export const SINGLE_PLAN_PRICE = 69.9;

export const businessSchema = z.object({
  ownerId: z.string().uuid(),
  businessName: z.string().min(2, 'Informe o nome do negócio.'),
  slug: z.string().min(2, 'Informe um slug válido.'),
  city: z.string().optional(),
  whatsapp: z.string().optional(),
  instagram: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  tagline: z.string().optional(),
  planName: z.string().default(SINGLE_PLAN_KEY),
  status: z.enum(['trial', 'active', 'blocked']).default('trial')
});
