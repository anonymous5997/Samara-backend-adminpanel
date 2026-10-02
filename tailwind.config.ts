import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Stacks resolve per scope: admin keeps the old fonts, .storefront
        // uses Manrope / Cormorant Garamond (see globals.css).
        sans: ['var(--font-sans-stack)'],
        serif: ['var(--font-serif-stack)'],
        display: ['var(--font-cormorant)', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gold-gradient': 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 50%, #D4AF37 100%)',
      },
      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        '900': '900ms',
        '1200': '1200ms',
        '1600': '1600ms',
      },
      letterSpacing: {
        eyebrow: '0.28em',
        'tighter': '-0.05em',
        'luxury': '-0.02em',
      },
      colors: {
        gold: {
          DEFAULT: '#D4AF37',
          light: '#F4D03F',
          dark: '#B8942F',
        },
        // Storefront redesign palette. Gold is an accent, not a theme.
        samara: {
          black: '#0B110D',
          ink: '#101914',
          char: '#17221A',
          forest: '#1B2A1F',
          'forest-2': '#22362A',
          ivory: '#F3EBDB',
          mute: '#A8A290',
          cream: '#F4ECDD',
          'cream-2': '#EADFCB',
          'cream-ink': '#2B2218',
          'cream-mute': '#6E6253',
          gold: '#C9A35F',
          'gold-deep': '#8A6420',
          line: 'rgba(243, 235, 219, 0.14)',
        },
        luxury: {
          black: '#0A0A0A',
          charcoal: '#111111',
          grey: '#9CA3AF',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
