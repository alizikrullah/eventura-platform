/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1E3A8A",
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#0F172A',
        },
        secondary: {
          DEFAULT: "#FF6B4A",
          50: '#FFF4ED',
          100: '#FFE6D5',
          200: '#FFC9AA',
          300: '#FFA574',
          400: '#FF6B4A',
          500: '#FF4814',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
        success: {
          50: '#ECFDF5',
          500: '#10B981',
          700: '#065F46',
        },
        warning: {
          50: '#FEF3C7',
          500: '#F59E0B',
          700: '#92400E',
        },
        error: {
          50: '#FEE2E2',
          500: '#EF4444',
          700: '#991B1B',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}