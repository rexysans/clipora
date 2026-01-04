/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    screens: {
      'sm': '640px',   // tablet
      'lg': '1024px',  // laptop
      'xl': '1280px',  // desktop
      '2xl': '1536px', // large screens
    },
    extend: {
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui"],
      },
      colors: {
        bg: "#0B0B0F",
        surface: "#15151C",
        accent: "#7C3AED",
        accentSoft: "#A78BFA",
        textPrimary: "#FFFFFF",
        textSecondary: "#9CA3AF",
      },
      fontSize: {
        // Mobile-first rem units with scaling at ≥1024px
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      },
    },
  },
  plugins: [],
}