import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#F7F2EC',
        surface: '#FFFFFF',
        text: '#2F2623',
        muted: '#7B6E68',
        primary: '#B58A6A',
        'primary-soft': '#EAD8CB',
        border: '#E7DDD5',
        dark: '#1E1A18'
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem'
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
        serif: ['var(--font-playfair)']
      }
    }
  },
  plugins: []
} satisfies Config;
