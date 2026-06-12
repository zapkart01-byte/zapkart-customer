/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#FF6B00', // electric orange for all CTAs
          soft:    '#FFF0E6', // soft orange tint for badges
          dark:    '#CC5500', // pressed states / hovers
        },
        surface: '#F8F9FA', // surface backgrounds for cards/inputs
        border:  '#E9ECEF', // input and divider borders
        text: {
          primary:   '#0D0D0D', // main titles / text
          secondary: '#6B7280', // labels and helper texts
        },
        success: {
          DEFAULT: '#16A34A',
          soft:    '#DCFCE7',
        },
        error: {
          DEFAULT: '#EF4444',
          soft:    '#FEE2E2',
        },
        warning: {
          DEFAULT: '#F59E0B',
          soft:    '#FEF3C7',
        },
        info: {
          DEFAULT: '#1D4ED8',
          soft:    '#DBEAFE',
        }
      },
      fontFamily: {
        inter: ['Inter'],
      }
    },
  },
  plugins: [],
}
