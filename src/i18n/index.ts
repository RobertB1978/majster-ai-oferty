import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Polish is the primary/default language for this app (target market: Poland).
// It is loaded statically so that:
//   1. i18n.t() calls in validations.ts (evaluated at module load time) always work.
//   2. Synchronous initialization (initImmediate: false) is preserved.
//
// English and Ukrainian are loaded on-demand when the user switches language.
// This avoids shipping ~two extra locale JSON files in the initial JS bundle
// for users who never change the language.
import pl from './locales/pl.json';

// Map of non-default language codes to dynamic import functions.
// Each import resolves to the full translation JSON when the user switches language.
const lazyLangLoaders: Record<string, () => Promise<{ default: Record<string, unknown> }>> = {
  en: () => import('./locales/en.json'),
  uk: () => import('./locales/uk.json'),
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      // Only the default language is bundled upfront.
      pl: { translation: pl },
    },
    fallbackLng: 'pl',
    supportedLngs: ['pl', 'en', 'uk'],
    // false = synchronous init; required because validations.ts calls i18n.t()
    // at module evaluation time (during Zod schema construction).
    initImmediate: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    // Allow the instance to serve requests even when a language bundle is not
    // yet fully loaded (i.e. while the dynamic import for EN/UK is in-flight).
    partialBundledLanguages: true,
  });

// Lazy-load EN or UK translations the first time the user switches to that language.
// After addResourceBundle() the i18next instance re-renders all subscribed components.
i18n.on('languageChanged', async (lang: string) => {
  const loader = lazyLangLoaders[lang];
  if (loader && !i18n.hasResourceBundle(lang, 'translation')) {
    try {
      const module = await loader();
      i18n.addResourceBundle(lang, 'translation', module.default, true, true);
    } catch {
      // Network error or chunk load failure — fall back to Polish silently.
    }
  }
});

export default i18n;
