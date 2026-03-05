/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5', // Indigo 600
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        secondary: {
          DEFAULT: '#14B8A6', // Teal 500
          100: '#CCFBF1',
          500: '#14B8A6',
          900: '#134E4A',
        },
        accent: {
          DEFAULT: '#F97316', // Orange 500
          100: '#FFEDD5',
          500: '#F97316',
          900: '#7C2D12',
        },
        neutral: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        background: '#FFFFFF',
        surface: '#F8FAFC',
      },
      fontFamily: {
        sans: ['System'], // Using System font for now, can swap for Inter later
      },
    },
  },
  plugins: [],
}
