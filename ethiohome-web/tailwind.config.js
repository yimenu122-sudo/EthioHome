export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#005baa',
          light: '#3381c6',
          dark: '#004080'
        },
        secondary: {
          DEFAULT: '#eeb822',
          light: '#f5cc5a',
          dark: '#cc9900'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
