import type { Resource } from 'i18next';
import en from '../en.json';

/**
 * i18next resources. The app ships a single language — English (en.json) — so it
 * is both the only bundled locale and the fallback. Language selection was
 * removed; there is nothing to switch to.
 */
export const resources: Resource = {
  en: { translation: en },
};
