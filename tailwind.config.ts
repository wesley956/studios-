import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--theme-bg, var(--background))',
        surface: 'var(--theme-surface, var(--surface))',
        text: 'var(--theme-text, var(--text))',
        muted: 'var(--theme-muted, var(--muted))',
        primary: 'var(--theme-primary, var(--primary))',
        'primary-soft': 'var(--theme-primary-soft, var(--primary-soft))',
        border: 'var(--theme-border, var(--border))',
        dark: 'var(--theme-accent, var(--dark))'
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem'
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
        serif: ['var(--font-playfair)']
      },
      boxShadow: {
        soft: '0 18px 45px -24px rgba(0,0,0,0.18)'
      }
    }
  },
  plugins: []
} satisfies Config;
