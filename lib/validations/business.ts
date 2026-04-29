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
    'barber_blue',
    'barber_green',
    'black_gold',
    'beauty_soft',
    'rose_lux',
    'lilac_glow',
    'nude_chic',
    'lux_gold',
    'clean_clinic',
    'clinic_blue',
    'emerald_calm',
    'modern_neutral',
    'modern_dark',
    'ocean_blue',
    'royal_purple',
    'terracotta',
    'sunset_coral',
    'mocha',
    'graphite_cyan'
  ]),
  planName: z.literal(SINGLE_PLAN_KEY).default(SINGLE_PLAN_KEY),
  status: z.enum(['trial', 'active', 'blocked']).default('trial')
});
