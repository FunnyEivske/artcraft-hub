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
      spacing: {
        '0.5': 'var(--space-0-5)',
        '1': 'var(--space-1)',
        '1.5': 'var(--space-1-5)',
        '2': 'var(--space-2)',
        '2.5': 'var(--space-2-5)',
        '3': 'var(--space-3)',
        '4': 'var(--space-4)',
        '5': 'var(--space-5)',
        '6': 'var(--space-6)',
        '8': 'var(--space-8)',
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
