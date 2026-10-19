/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sand: {
          50: '#FAF8F5',
          100: '#F5F1EB',
          200: '#EAE2D6',
          300: '#DCCFBF',
          400: '#CBB8A2',
          500: '#B59D82',
          600: '#9B8064',
          700: '#7E654E',
          800: '#644F3C',
          900: '#4F3F30',
        },
        couture: {
          black: '#121212',
          charcoal: '#1E1E22',
          card: '#24242A',
          gold: '#D4AF37',
          rose: '#E8A598',
          sage: '#98A892'
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'pulse-subtle': 'pulseSubtle 2.5s infinite ease-in-out',
        'spin-slow': 'spin 18s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        }
      }
    },
  },
  plugins: [],
}
