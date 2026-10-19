import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import nb from './locales/nb.json';

const LANGUAGE_STORAGE_KEY = 'openart_language';

export function getStoredLanguage(): string {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === 'en' || stored === 'nb') return stored;
  } catch {
    // Fallback
  }
  return 'en';
}

export function setLanguage(lang: 'en' | 'nb'): void {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // Non-critical
  }
  i18n.changeLanguage(lang);
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      nb: { translation: nb },
    },
    lng: getStoredLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;
