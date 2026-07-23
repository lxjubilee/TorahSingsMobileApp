// Catalog language helpers for JubiLujah — ported from the web app
// (jubilujah.com `lib/languages.ts`).
//
// The app UI is English-only (language selection was removed), but the CATALOG
// still contains albums in many languages: an album's language is encoded in the
// trailing letters of its catalog code (…EN = English, …ES = Spanish,
// …ID = Indonesian, …YUE = Cantonese), so `albumLanguage()` derives it from the
// code — there is NO language field in the manifest. In this app `Album.id` and
// `Track.albumId` ARE the album code, so pass those straight in. Only English
// (and legacy non-language) albums are shown; foreign-language translations are
// filtered out (see `albumVisibleInLang`).

export const DEFAULT_LANG = 'en';

// 2-letter album-code suffix → our canonical language code. The catalog uses a
// distinct suffix per language: …BR = Brazilian Portuguese, …PT = European
// Portuguese (so they ARE told apart by the suffix).
const SUFFIX_TO_LANG: Record<string, string> = {
  en: 'en', es: 'es', fr: 'fr', de: 'de', it: 'it', br: 'pt-BR', pt: 'pt-PT', nl: 'nl', ru: 'ru',
  pl: 'pl', zh: 'zh', ja: 'ja', ko: 'ko', ar: 'ar', hi: 'hi', th: 'th', tr: 'tr',
  vi: 'vi', tl: 'tl', he: 'he', sv: 'sv', da: 'da', cs: 'cs', hu: 'hu', bg: 'bg',
  hr: 'hr', id: 'id', ro: 'ro', uk: 'uk',
  el: 'el', yue: 'yue', ms: 'ms', ur: 'ur', bn: 'bn', ta: 'ta', fa: 'fa', sw: 'sw',
  no: 'no', fi: 'fi', af: 'af', la: 'la',
};

export function albumLanguage(code: string): string {
  // The language suffix follows the 4-letter prefix + 4-digit number. It is
  // usually 2 letters (…EN, …ES) but can be longer (…YUE = Cantonese), so we
  // extract the trailing letters after the numeric block rather than slice(-2).
  const m = /^[A-Za-z]{4}\d{4}([A-Za-z-]+)$/.exec(String(code || '').trim());
  const suffix = (m ? m[1] : String(code || '').slice(-2)).toLowerCase();
  return SUFFIX_TO_LANG[suffix] || 'other';
}

// BCP-47 lang tag for an album's language, for the `lang` attribute on
// foreign-language text. CRITICAL for CJK: kanji/hanzi/hanja share Unicode
// codepoints (CJK unification). Returns undefined for en/other.
export function albumBcp47(code: string): string | undefined {
  const l = albumLanguage(code);
  if (l === 'en' || l === 'other') return undefined;
  return ({ yue: 'zh-HK' } as Record<string, string>)[l] || l;
}

// The set of recognized NON-English catalog languages — derived from EVERY
// suffix the catalog can encode, so an album in any foreign language is kept off
// the default English view.
const FOREIGN_LANGS = new Set(Object.values(SUFFIX_TO_LANG).filter((v) => v !== DEFAULT_LANG));

// Should an album (by its code) be shown while the UI is set to `lang`? The app
// is English-only, so in practice this always runs with lang === 'en': show
// English ('en') AND non-language / legacy albums ('other', e.g. children's),
// and HIDE recognized foreign-language translations (…RO, …ES, …AR, …BR, …PT, …).
export function albumVisibleInLang(code: string, lang: string): boolean {
  const al = albumLanguage(code);
  if (lang === DEFAULT_LANG) return !FOREIGN_LANGS.has(al);
  return al === lang;
}
