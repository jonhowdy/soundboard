/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Themeable tokens driven by CSS variables (see src/themes).
        surface: 'rgb(var(--sb-surface) / <alpha-value>)',
        panel: 'rgb(var(--sb-panel) / <alpha-value>)',
        elevated: 'rgb(var(--sb-elevated) / <alpha-value>)',
        ink: 'rgb(var(--sb-ink) / <alpha-value>)',
        muted: 'rgb(var(--sb-muted) / <alpha-value>)',
        accent: 'rgb(var(--sb-accent) / <alpha-value>)',
        accent2: 'rgb(var(--sb-accent2) / <alpha-value>)',
        line: 'rgb(var(--sb-line) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      boxShadow: {
        glow: '0 0 0 1px rgb(var(--sb-accent) / 0.4), 0 8px 30px -6px rgb(var(--sb-accent) / 0.45)',
      },
      keyframes: {
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '0.5' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
        pulseglow: {
          '0%,100%': { boxShadow: '0 0 0 0 rgb(var(--sb-accent) / 0.5)' },
          '50%': { boxShadow: '0 0 0 10px rgb(var(--sb-accent) / 0)' },
        },
        pop: {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(0.94)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        ripple: 'ripple 600ms ease-out',
        pulseglow: 'pulseglow 1.4s ease-out infinite',
        pop: 'pop 220ms ease-out',
      },
    },
  },
  plugins: [],
};
