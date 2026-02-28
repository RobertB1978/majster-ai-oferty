import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// All locale bundles are imported statically so that i18next has every
// translation available synchronously at startup — regardless of which
// language the user's browser/localStorage reports.
//
// Why not lazy-load EN/UK?
//   Lazy loading created a race condition: i18next would fire
//   "languageChanged" and start a dynamic import, but React already
//   rendered the first frame using the PL fallback bundle.  The result
//   was visible "flash of Polish" and deterministic test failures in
//   Playwright (networkidle fired before addResourceBundle re-render).
//
// Size trade-off:
//   All three JSON files together are ~320 KB (uncompressed); gzipped
//   they compress to ~60 KB total.  This is acceptable given the
//   multi-language requirement and the elimination of the flash.
import pl from './locales/pl.json';
import en from './locales/en.json';
import uk from './locales/uk.json';

// Migrate stored language code: 'ua' → 'uk' (ISO 639-1 correction).
// Older browser sessions may have the non-standard code 'ua' cached in localStorage.
// This must run before i18n.init() so the LanguageDetector picks up the correct value.
try {
  const saved = window.localStorage.getItem('i18nextLng');
  if (saved === 'ua') window.localStorage.setItem('i18nextLng', 'uk');
} catch {
  // No localStorage available (SSR / strict privacy mode) — ignore silently.
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      pl: { translation: pl },
      en: { translation: en },
      uk: { translation: uk },
    },
    fallbackLng: 'pl',
    supportedLngs: ['pl', 'en', 'uk'],
    // false = synchronous init; required because validations.ts calls i18n.t()
    // at module evaluation time (during Zod schema construction).
    initImmediate: false,
    // Treat empty string values ("") as missing — triggers fallback to 'pl'.
    // Prevents placeholder keys from rendering as blank UI labels.
    returnEmptyString: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;
