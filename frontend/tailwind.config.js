/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      },
      colors: {
        amaru: {
          copper: '#B34B0C',
          earth: '#7C3306',
          dark: '#37322E',
          'surface-dark': '#24211F',
          'bg-dark': '#1A1816',
          gray: '#524944',
          steel: '#6C6A68',
          'light-gray': '#B3B2B0',
        },
        'amaru-copper': '#B34B0C',
        'amaru-earth': '#7C3306',
        'amaru-dark': '#37322E',
        'amaru-surface-dark': '#24211F',
        'amaru-bg-dark': '#1A1816',
        'amaru-gray': '#524944',
        'amaru-steel': '#6C6A68',
        'amaru-light-gray': '#B3B2B0',
      },
    },
  },
  plugins: [],
}
