/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#caf0f8',
          DEFAULT: '#00b4d8', // Cyan
          dark: '#0077b6',   // Dark Blue
          hover: '#0096c7'   // Medium Blue
        },
        light: {
          bg: '#f9f9f9',
          surface: '#ffffff',
          border: '#eeeeee',
          text: '#222222',
          sub: '#666666'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Segoe UI', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
