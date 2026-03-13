/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      spacing: {
        4.5: '1.125rem',
        13: '3.25rem',
        18: '4.5rem',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(15, 23, 42, 0.08), 0 4px 16px -4px rgba(15, 23, 42, 0.06)',
        'soft-lg': '0 4px 20px -4px rgba(15, 23, 42, 0.1), 0 8px 32px -8px rgba(15, 23, 42, 0.08)',
        'inner-soft': 'inset 0 1px 2px 0 rgba(15, 23, 42, 0.04)',
      },
      transitionDuration: {
        150: '150ms',
      },
      ringColor: {
        DEFAULT: 'rgb(148 163 184 / 0.5)',
      },
    },
  },
  plugins: [],
};
