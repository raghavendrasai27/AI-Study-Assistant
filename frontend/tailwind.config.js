/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        warm: {
          50: '#faf8f5',
          100: '#f5efe6',
          200: '#ebdccb',
          300: '#dec2a8',
          400: '#cfa381',
          500: '#bc855e',
          600: '#9d6749',
          700: '#7b4f3b',
          800: '#5f3d30',
          900: '#4a3027',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'bounce-soft': 'bounce-soft 2s infinite ease-in-out',
        'pulse-subtle': 'pulse-subtle 3s infinite ease-in-out',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        'bounce-soft': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
