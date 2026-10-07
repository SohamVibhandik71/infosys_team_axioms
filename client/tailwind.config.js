/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111111",
        cream: "#FFF8E7",
        'neo-cream': "#FFF8E7",
        'neo-yellow': "#FFD93D",
        neoYellow: "#FFD93D",
        'neo-blue': "#4D96FF",
        neoBlue: "#4D96FF",
        'neo-green': "#6BCB77",
        neoGreen: "#6BCB77",
        'neo-coral': "#FF6B6B",
        neoCoral: "#FF6B6B",
        'neo-lavender': "#B8A1FF",
        neoLavender: "#B8A1FF",
        'neo-white': "#FFFFFF",
        neoWhite: "#FFFFFF"
      },
      boxShadow: {
        'neo-xs': '1px 1px 0px #111111',
        'neo-sm': '2px 2px 0px #111111',
        'neo': '4px 4px 0px #111111',
        'neo-md': '4px 4px 0px #111111',
        'neo-lg': '6px 6px 0px #111111',
        'neo-xl': '8px 8px 0px #111111'
      },
      borderWidth: {
        '2': '2px',
        '3': '3px',
        '4': '4px'
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        scaleUp: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out forwards',
        scaleUp: 'scaleUp 0.15s ease-out forwards'
      }
    },
  },
  plugins: [],
}
