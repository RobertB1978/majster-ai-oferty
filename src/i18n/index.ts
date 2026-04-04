import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Polish is always loaded synchronously — it's the primary language AND fallback.
// EN/UK are loaded dynamically to reduce the entry chunk by ~560 KB.
import pl from './locales/pl.json';

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

/**
 * Load a non-PL locale bundle dynamically and register it with i18next.
 * Returns a Promise that resolves once the bundle is available.
 * Call this BEFORE React renders to avoid a "flash of Polish" for EN/UK users.
 */
export async function loadLocaleAsync(lang: string): Promise<void> {
  if (lang === 'pl') return; // already loaded synchronously
  try {
    let data: { default: Record<string, unknown> };
    if (lang === 'en') {
      data = await import('./locales/en.json');
    } else if (lang === 'uk') {
      data = await import('./locales/uk.json');
    } else {
      return;
    }
    i18n.addResourceBundle(lang, 'translation', data.default, true, true);
  } catch {
    // Fallback to PL silently — Polish is always available.
  }
}

export default i18n;

// Preload remaining locales in idle time and handle runtime language changes.
// This ensures that switching language in settings is instant (no network wait).
i18n.on('languageChanged', (lang: string) => {
  if (lang !== 'pl' && !i18n.hasResourceBundle(lang, 'translation')) {
    loadLocaleAsync(lang);
  }
});
if (typeof requestIdleCallback === 'function') {
  requestIdleCallback(() => {
    ['en', 'uk'].forEach(lang => {
      if (!i18n.hasResourceBundle(lang, 'translation')) {
        loadLocaleAsync(lang);
      }
    });
  }, { timeout: 5000 });
}
