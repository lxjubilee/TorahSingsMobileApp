import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from './locales';

/**
 * i18next setup. The app is single-language (English) — language selection was
 * removed, so the locale is fixed to English with no device detection and no
 * user switching. Strings live in `en.json`.
 */
export { resources };

void i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export default i18n;
