/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        ui: {
          bg: 'var(--color-bg)',
          surface: 'var(--color-surface)',
          hover: 'var(--color-surface-hover)',
          active: 'var(--color-surface-active)',
          panel: 'var(--color-surface-panel)',
          card: 'var(--color-surface)',
          border: 'var(--color-border)',
          line: 'var(--color-border-subtle)',
          text: 'var(--color-text)',
          muted: 'var(--color-text-muted)',
          faint: 'var(--color-text-faint)',
          blue: 'var(--color-accent)',
          blueHover: 'var(--color-accent-hover)',
          accent: 'var(--color-accent)',
          accentHover: 'var(--color-accent-hover)',
          accentSubtle: 'var(--color-accent-subtle)',
        },
      },

      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        full: 'var(--radius-full)',
      },
      fontFamily: {
        sans: ['"Source Sans 3"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        menu: 'var(--shadow-menu)',
      },
    },
  },
  plugins: [],
}
