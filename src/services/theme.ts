export type ThemeMode = 'system' | 'light' | 'dark';

const THEME_STORAGE_KEY = 'openart_theme';

export function getSystemResolvedTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // Non-critical fallback
  }
  return 'system';
}

export function applyTheme(mode: ThemeMode): 'light' | 'dark' {
  const resolved = mode === 'system' ? getSystemResolvedTheme() : mode;
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', resolved);
    // Also toggle Tailwind's dark class for backwards-compatibility
    if (resolved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
  return resolved;
}

export function setTheme(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // Non-critical
  }
  applyTheme(mode);
}

export function initTheme(): () => void {
  const current = getStoredTheme();
  applyTheme(current);

  // Listen for OS scheme changes if in system mode
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (getStoredTheme() === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }

  return () => {};
}
