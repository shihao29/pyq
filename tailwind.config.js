/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'wx-blue': '#576b95',
        'wx-bg': '#f8f8f8',
        'wx-line': '#e5e5e5',
        'wx-gray': '#b2b2b2',
        'wx-light-gray': '#f3f3f5',
        'wx-green': '#07c160',
      },
    },
  },
  plugins: [],
}
