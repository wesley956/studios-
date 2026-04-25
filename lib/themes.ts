export type BusinessType =
  | 'barbearia'
  | 'salao'
  | 'estetica'
  | 'nail_designer'
  | 'cilios'
  | 'studio_geral';

export type ThemeKey =
  | 'barber_dark'
  | 'beauty_soft'
  | 'lux_gold'
  | 'clean_clinic'
  | 'modern_neutral';

export const BUSINESS_TYPE_OPTIONS: Array<{ value: BusinessType; label: string }> = [
  { value: 'barbearia', label: 'Barbearia' },
  { value: 'salao', label: 'Salão' },
  { value: 'estetica', label: 'Estética' },
  { value: 'nail_designer', label: 'Nail designer' },
  { value: 'cilios', label: 'Cílios / sobrancelhas' },
  { value: 'studio_geral', label: 'Studio geral' }
];

export const THEME_OPTIONS: Array<{ value: ThemeKey; label: string }> = [
  { value: 'barber_dark', label: 'Barber Dark' },
  { value: 'beauty_soft', label: 'Beauty Soft' },
  { value: 'lux_gold', label: 'Lux Gold' },
  { value: 'clean_clinic', label: 'Clean Clinic' },
  { value: 'modern_neutral', label: 'Modern Neutral' }
];

export const DEFAULT_THEME_BY_BUSINESS_TYPE: Record<BusinessType, ThemeKey> = {
  barbearia: 'barber_dark',
  salao: 'beauty_soft',
  estetica: 'clean_clinic',
  nail_designer: 'lux_gold',
  cilios: 'beauty_soft',
  studio_geral: 'modern_neutral'
};

export function getSuggestedThemeByBusinessType(businessType: string | null | undefined): ThemeKey {
  const type = (businessType || 'studio_geral') as BusinessType;
  return DEFAULT_THEME_BY_BUSINESS_TYPE[type] || 'modern_neutral';
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
  }
};

export function getThemePalette(themeKey: string | null | undefined): ThemePalette {
  const key = (themeKey || 'modern_neutral') as ThemeKey;
  return THEMES[key] || THEMES.modern_neutral;
}

export function buildThemeStyleVars(themeKey: string | null | undefined) {
  const theme = getThemePalette(themeKey);

  return {
    '--theme-bg': theme.bg,
    '--theme-surface': theme.surface,
    '--theme-surface-alt': theme.surfaceAlt,
    '--theme-primary': theme.primary,
    '--theme-primary-soft': theme.primarySoft,
    '--theme-accent': theme.accent,
    '--theme-text': theme.text,
    '--theme-muted': theme.muted,
    '--theme-border': theme.border,
    '--theme-ring': theme.ring
  } as React.CSSProperties;
}
