import { z } from 'zod';

export const SINGLE_PLAN_LABEL = 'Plano único';
export const SINGLE_PLAN_PRICE = 69.9;
export const SINGLE_PLAN_KEY = 'single';

export const businessSchema = z.object({
  ownerId: z.string().uuid(),
  businessName: z.string().min(2, 'Informe o nome do negócio.'),
  slug: z.string().min(2, 'Informe o slug.'),
  city: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  tagline: z.string().optional().nullable(),
  businessType: z.enum([
    'barbearia',
    'salao',
    'estetica',
    'nail_designer',
    'cilios',
    'studio_geral'
  ]),
  themeKey: z.enum([
    'barber_dark',
    'beauty_soft',
    'lux_gold',
    'clean_clinic',
    'modern_neutral'
  ]),
  planName: z.literal(SINGLE_PLAN_KEY).default(SINGLE_PLAN_KEY),
  status: z.enum(['trial', 'active', 'blocked']).default('trial')
});
