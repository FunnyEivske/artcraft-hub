import colors from 'tailwindcss/colors';

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
        // Neutral greys instead of the blue-tinted slate, so every view reads
        // as a calm desktop app rather than a neon dashboard.
        slate: colors.neutral,
        // Single accent: a plain, confident blue used only for primary actions.
        indigo: {
          50: '#eaf3fe',
          100: '#cfe3fc',
          200: '#a3cafa',
          300: '#78b2f6',
          400: '#4b9cf5',
          500: '#2680eb',
          600: '#1473e6',
          700: '#0d66d0',
          800: '#095aba',
          900: '#064a9b',
          950: '#04306a',
        },
        ui: {
          bg: '#1b1b1b',
          rail: '#222222',
          panel: '#262626',
          card: '#2b2b2b',
          hover: '#323232',
          border: '#383838',
          line: '#2e2e2e',
          text: '#ececec',
          muted: '#a6a6a6',
          faint: '#767676',
          blue: '#1473e6',
          blueHover: '#0d66d0',
          blueText: '#5aa6f8',
        },
      },
      fontFamily: {
        sans: ['"Source Sans 3"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        menu: '0 4px 16px rgba(0, 0, 0, 0.45)',
      },
    },
  },
  plugins: [],
}
