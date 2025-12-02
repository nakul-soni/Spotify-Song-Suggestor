/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.html",
    "./app.js",
    "./**/*.js"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        spotify: '#1DB954',
        'dark-bg': '#0F0F23',
        'light-bg': '#FAFAFA',
      },
      animation: {
        'pulse-gradient': 'pulse-gradient 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'vinyl-spin': 'vinyl-spin 3s linear infinite',
        'slide-up': 'slide-up 0.6s ease-out',
        'fade-in': 'fade-in 0.8s ease-out',
        'scale-in': 'scale-in 0.5s ease-out',
      },
      backdropBlur: {
        xl: '24px',
      },
      brightness: {
        125: '1.25',
      },
      ringColor: {
        'spotify': '#1DB954',
        'happy': '#FFD700',
        'chill': '#667EEA',
        'focus': '#4ECDC4',
        'energetic': '#FF6B6B',
        'nostalgic': '#A8E6CF',
      },
      keyframes: {
        'pulse-gradient': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'vinyl-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-happy': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
        'gradient-chill': 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
        'gradient-focus': 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
        'gradient-energetic': 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
        'gradient-nostalgic': 'linear-gradient(135deg, #A8E6CF 0%, #88D8A3 100%)',
        'gradient-neutral': 'linear-gradient(135deg, #2C3E50 0%, #34495E 100%)',
      },
    },
  },
  plugins: [],
}

