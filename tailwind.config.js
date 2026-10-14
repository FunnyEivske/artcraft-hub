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
        hub: {
          bg: '#0d0f12',
          surface: '#151921',
          surfaceLighter: '#1d232e',
          card: '#181e28',
          cardBorder: '#283244',
          accent: '#6366f1',
          accentHover: '#4f46e5',
          cyan: '#06b6d4',
          pink: '#ec4899',
          amber: '#f59e0b',
          emerald: '#10b981',
          purple: '#8b5cf6',
          textMuted: '#94a3b8',
          textBright: '#f8fafc',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 25px -5px rgba(99, 102, 241, 0.35)',
        glowCyan: '0 0 25px -5px rgba(6, 182, 212, 0.35)',
      }
    },
  },
  plugins: [],
}
