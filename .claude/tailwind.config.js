module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#FF6B00',
          soft:    '#FFF0E6',
          dark:    '#CC5500',
        },
        surface: '#F8F9FA',
        border:  '#E9ECEF',
      }
    }
  },
  plugins: []
}