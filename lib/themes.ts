import type { CSSProperties } from 'react';

export type BusinessType =
  | 'barbearia'
  | 'salao'
  | 'estetica'
  | 'nail_designer'
  | 'cilios'
  | 'studio_geral';

export type ThemeKey =
  | 'barber_dark'
  | 'barber_blue'
  | 'barber_green'
  | 'black_gold'
  | 'beauty_soft'
  | 'rose_lux'
  | 'lilac_glow'
  | 'nude_chic'
  | 'lux_gold'
  | 'clean_clinic'
  | 'clinic_blue'
  | 'emerald_calm'
  | 'modern_neutral'
  | 'modern_dark'
  | 'ocean_blue'
  | 'royal_purple'
  | 'terracotta'
  | 'sunset_coral'
  | 'mocha'
  | 'graphite_cyan';

export const BUSINESS_TYPE_OPTIONS: Array<{ value: BusinessType; label: string }> = [
  { value: 'barbearia', label: 'Barbearia' },
  { value: 'salao', label: 'Salão' },
  { value: 'estetica', label: 'Estética' },
  { value: 'nail_designer', label: 'Nail designer' },
  { value: 'cilios', label: 'Cílios / sobrancelhas' },
  { value: 'studio_geral', label: 'Studio geral' }
];

export const THEME_OPTIONS: Array<{
  value: ThemeKey;
  label: string;
  description: string;
  group: 'Escuro' | 'Elegante' | 'Clínico' | 'Moderno' | 'Quente';
}> = [
  {
    value: 'barber_dark',
    label: 'Barber Dark',
    description: 'Preto, dourado e madeira. Forte para barbearias.',
    group: 'Escuro'
  },
  {
    value: 'barber_blue',
    label: 'Barber Navy',
    description: 'Azul-marinho, grafite e cobre. Masculino e premium.',
    group: 'Escuro'
  },
  {
    value: 'barber_green',
    label: 'Barber Forest',
    description: 'Verde escuro, couro e areia. Visual clássico.',
    group: 'Escuro'
  },
  {
    value: 'black_gold',
    label: 'Black Gold',
    description: 'Preto elegante com dourado intenso. Luxo direto.',
    group: 'Escuro'
  },
  {
    value: 'beauty_soft',
    label: 'Beauty Soft',
    description: 'Rosa claro e dourado suave. Delicado e acolhedor.',
    group: 'Elegante'
  },
  {
    value: 'rose_lux',
    label: 'Rose Lux',
    description: 'Rosé, vinho e champagne. Sofisticado sem exagero.',
    group: 'Elegante'
  },
  {
    value: 'lilac_glow',
    label: 'Lilac Glow',
    description: 'Lilás, lavanda e brilho frio. Bom para nails e cílios.',
    group: 'Elegante'
  },
  {
    value: 'nude_chic',
    label: 'Nude Chic',
    description: 'Nude, marrom suave e creme. Limpo e fino.',
    group: 'Elegante'
  },
  {
    value: 'lux_gold',
    label: 'Lux Gold',
    description: 'Dourado clássico com fundo claro. Premium tradicional.',
    group: 'Elegante'
  },
  {
    value: 'clean_clinic',
    label: 'Clean Clinic',
    description: 'Verde suave e branco. Sensação de cuidado e saúde.',
    group: 'Clínico'
  },
  {
    value: 'clinic_blue',
    label: 'Clinic Blue',
    description: 'Azul claro, branco e cinza. Profissional e confiável.',
    group: 'Clínico'
  },
  {
    value: 'emerald_calm',
    label: 'Emerald Calm',
    description: 'Esmeralda suave e creme. Natural, calmo e moderno.',
    group: 'Clínico'
  },
  {
    value: 'modern_neutral',
    label: 'Modern Neutral',
    description: 'Azul acinzentado e branco. Neutro para qualquer studio.',
    group: 'Moderno'
  },
  {
    value: 'modern_dark',
    label: 'Modern Dark',
    description: 'Grafite, azul e branco. Forte, limpo e atual.',
    group: 'Moderno'
  },
  {
    value: 'ocean_blue',
    label: 'Ocean Blue',
    description: 'Azul oceano e areia. Tranquilo, fresco e profissional.',
    group: 'Moderno'
  },
  {
    value: 'royal_purple',
    label: 'Royal Purple',
    description: 'Roxo profundo e prata. Marcante e sofisticado.',
    group: 'Moderno'
  },
  {
    value: 'terracotta',
    label: 'Terracotta',
    description: 'Terra, argila e creme. Artesanal, humano e acolhedor.',
    group: 'Quente'
  },
  {
    value: 'sunset_coral',
    label: 'Sunset Coral',
    description: 'Coral, pêssego e vinho. Vibrante sem ficar pesado.',
    group: 'Quente'
  },
  {
    value: 'mocha',
    label: 'Mocha',
    description: 'Café, creme e dourado queimado. Sofisticado e quente.',
    group: 'Quente'
  },
  {
    value: 'graphite_cyan',
    label: 'Graphite Cyan',
    description: 'Grafite e ciano. Tecnológico, masculino e objetivo.',
    group: 'Escuro'
  }
];

export const DEFAULT_THEME_BY_BUSINESS_TYPE: Record<BusinessType, ThemeKey> = {
  barbearia: 'barber_blue',
  salao: 'rose_lux',
  estetica: 'clinic_blue',
  nail_designer: 'lilac_glow',
  cilios: 'nude_chic',
  studio_geral: 'modern_neutral'
};

export function getSuggestedThemeByBusinessType(businessType: string | null | undefined): ThemeKey {
  const normalized = (businessType || 'studio_geral') as BusinessType;
  return DEFAULT_THEME_BY_BUSINESS_TYPE[normalized] || 'modern_neutral';
}

export type ThemePalette = {
  bg: string;
  surface: string;
  surfaceAlt: string;
  primary: string;
  primarySoft: string;
  accent: string;
  text: string;
  muted: string;
  border: string;
  ring: string;
};

export const THEMES: Record<ThemeKey, ThemePalette> = {
  barber_dark: {
    bg: '#111111',
    surface: '#1b1b1b',
    surfaceAlt: '#232323',
    primary: '#d4a017',
    primarySoft: '#2b2412',
    accent: '#8b5e3c',
    text: '#f5f5f5',
    muted: '#b3b3b3',
    border: '#2e2e2e',
    ring: '#d4a017'
  },
  barber_blue: {
    bg: '#07111f',
    surface: '#101b2e',
    surfaceAlt: '#162640',
    primary: '#38bdf8',
    primarySoft: '#0f2a3d',
    accent: '#c08457',
    text: '#eef6ff',
    muted: '#9fb3c8',
    border: '#263a55',
    ring: '#38bdf8'
  },
  barber_green: {
    bg: '#0b1511',
    surface: '#13221c',
    surfaceAlt: '#1a3026',
    primary: '#c8a15a',
    primarySoft: '#2d2618',
    accent: '#5e8b6a',
    text: '#f4f1e8',
    muted: '#b8aa96',
    border: '#2d4036',
    ring: '#c8a15a'
  },
  black_gold: {
    bg: '#070707',
    surface: '#151515',
    surfaceAlt: '#221b0d',
    primary: '#f2c14e',
    primarySoft: '#2d2209',
    accent: '#fff3c4',
    text: '#fbfaf7',
    muted: '#b9b0a3',
    border: '#352d1e',
    ring: '#f2c14e'
  },
  beauty_soft: {
    bg: '#fff7fb',
    surface: '#ffffff',
    surfaceAlt: '#fff0f6',
    primary: '#c06c84',
    primarySoft: '#fde8ef',
    accent: '#d4a373',
    text: '#2b1f28',
    muted: '#7d6672',
    border: '#f1d9e2',
    ring: '#c06c84'
  },
  rose_lux: {
    bg: '#fff6f7',
    surface: '#ffffff',
    surfaceAlt: '#fdebed',
    primary: '#9f4056',
    primarySoft: '#f7dce2',
    accent: '#c8996b',
    text: '#2e1920',
    muted: '#7a5863',
    border: '#efcfd6',
    ring: '#9f4056'
  },
  lilac_glow: {
    bg: '#fbf7ff',
    surface: '#ffffff',
    surfaceAlt: '#f2e8ff',
    primary: '#7c3aed',
    primarySoft: '#ede2ff',
    accent: '#c084fc',
    text: '#25143d',
    muted: '#6d5a80',
    border: '#e2d2f4',
    ring: '#7c3aed'
  },
  nude_chic: {
    bg: '#fbf5ef',
    surface: '#ffffff',
    surfaceAlt: '#f2e4d8',
    primary: '#9a6b4f',
    primarySoft: '#ead7c8',
    accent: '#5f4638',
    text: '#2f231c',
    muted: '#7b6658',
    border: '#e4d1c2',
    ring: '#9a6b4f'
  },
  lux_gold: {
    bg: '#faf6ef',
    surface: '#ffffff',
    surfaceAlt: '#f6eee1',
    primary: '#b8891f',
    primarySoft: '#f5ead0',
    accent: '#2d2a26',
    text: '#2e2417',
    muted: '#7c6a52',
    border: '#eadcc0',
    ring: '#b8891f'
  },
  clean_clinic: {
    bg: '#f7faf8',
    surface: '#ffffff',
    surfaceAlt: '#eef5f1',
    primary: '#6b9080',
    primarySoft: '#e4f0ea',
    accent: '#8aa1b1',
    text: '#22302b',
    muted: '#667873',
    border: '#d9e7e0',
    ring: '#6b9080'
  },
  clinic_blue: {
    bg: '#f5f9ff',
    surface: '#ffffff',
    surfaceAlt: '#e8f2ff',
    primary: '#2563eb',
    primarySoft: '#dbeafe',
    accent: '#0891b2',
    text: '#162033',
    muted: '#5f6f89',
    border: '#d7e4f7',
    ring: '#2563eb'
  },
  emerald_calm: {
    bg: '#f3fbf7',
    surface: '#ffffff',
    surfaceAlt: '#e1f5eb',
    primary: '#047857',
    primarySoft: '#d1fae5',
    accent: '#0e7490',
    text: '#10251f',
    muted: '#5c746b',
    border: '#cce7da',
    ring: '#047857'
  },
  modern_neutral: {
    bg: '#f7f8fa',
    surface: '#ffffff',
    surfaceAlt: '#eef1f5',
    primary: '#355c7d',
    primarySoft: '#e6edf5',
    accent: '#6c7a89',
    text: '#1f2933',
    muted: '#667085',
    border: '#d8dee6',
    ring: '#355c7d'
  },
  modern_dark: {
    bg: '#0f172a',
    surface: '#162033',
    surfaceAlt: '#1e293b',
    primary: '#60a5fa',
    primarySoft: '#10233f',
    accent: '#94a3b8',
    text: '#f8fafc',
    muted: '#b7c4d7',
    border: '#334155',
    ring: '#60a5fa'
  },
  ocean_blue: {
    bg: '#f0f9ff',
    surface: '#ffffff',
    surfaceAlt: '#dff3ff',
    primary: '#0284c7',
    primarySoft: '#bae6fd',
    accent: '#0f766e',
    text: '#0d2635',
    muted: '#587486',
    border: '#c7e6f6',
    ring: '#0284c7'
  },
  royal_purple: {
    bg: '#130b22',
    surface: '#211334',
    surfaceAlt: '#311b4b',
    primary: '#a78bfa',
    primarySoft: '#2c1a46',
    accent: '#f0abfc',
    text: '#fbf8ff',
    muted: '#c4b5d8',
    border: '#493160',
    ring: '#a78bfa'
  },
  terracotta: {
    bg: '#fff7ed',
    surface: '#ffffff',
    surfaceAlt: '#ffedd5',
    primary: '#c2410c',
    primarySoft: '#fed7aa',
    accent: '#92400e',
    text: '#311c11',
    muted: '#7c5d4d',
    border: '#f3d0b5',
    ring: '#c2410c'
  },
  sunset_coral: {
    bg: '#fff5f2',
    surface: '#ffffff',
    surfaceAlt: '#ffe5de',
    primary: '#e85d75',
    primarySoft: '#ffd7df',
    accent: '#a53860',
    text: '#331a20',
    muted: '#7b5960',
    border: '#f4cbd2',
    ring: '#e85d75'
  },
  mocha: {
    bg: '#f8f1ea',
    surface: '#ffffff',
    surfaceAlt: '#eadbcd',
    primary: '#7c4a2d',
    primarySoft: '#e9d2c1',
    accent: '#b9823f',
    text: '#2d2018',
    muted: '#765f50',
    border: '#dbc4b3',
    ring: '#7c4a2d'
  },
  graphite_cyan: {
    bg: '#08111f',
    surface: '#111827',
    surfaceAlt: '#172033',
    primary: '#22d3ee',
    primarySoft: '#0d2a34',
    accent: '#38bdf8',
    text: '#ecfeff',
    muted: '#a6bdca',
    border: '#263445',
    ring: '#22d3ee'
  }
};

export function getThemePalette(themeKey: string | null | undefined): ThemePalette {
  const normalized = (themeKey || 'modern_neutral') as ThemeKey;
  return THEMES[normalized] || THEMES.modern_neutral;
}

export function buildThemeStyleVars(themeKey: string | null | undefined): CSSProperties {
  const theme = getThemePalette(themeKey);

  return {
    ['--theme-bg' as string]: theme.bg,
    ['--theme-surface' as string]: theme.surface,
    ['--theme-surface-alt' as string]: theme.surfaceAlt,
    ['--theme-primary' as string]: theme.primary,
    ['--theme-primary-soft' as string]: theme.primarySoft,
    ['--theme-accent' as string]: theme.accent,
    ['--theme-text' as string]: theme.text,
    ['--theme-muted' as string]: theme.muted,
    ['--theme-border' as string]: theme.border,
    ['--theme-ring' as string]: theme.ring
  };
}
