/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2f7f5',
          100: '#dfece5',
          200: '#b9d7c8',
          300: '#8cbca6',
          400: '#5f9d83',
          500: '#3f7f68',
          600: '#2f6553',
          700: '#265144',
          800: '#204238',
          900: '#1b372f',
        },
      },
    },
  },
  plugins: [],
}
