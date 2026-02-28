/**
 * i18next TypeScript Type Augmentation
 *
 * Extends i18next's CustomTypeOptions so that t() is typed against the
 * Polish locale file (source of truth for all translation keys).
 *
 * Benefits:
 *  • IDE autocomplete for t('...') key strings
 *  • Compile-time error when a key doesn't exist in pl.json
 *  • Prevents typos in key names from silently returning the key itself at runtime
 *
 * Performance note (i18next docs):
 *  TypeScript may become slower with very large locale files. If you observe
 *  OOM or significantly longer tsc times, set strictKeyChecks: false below
 *  and rely on the runtime parity gate (scripts/i18n/check-parity.ts) instead.
 *
 * @see https://www.i18next.com/overview/typescript
 */
import 'i18next';
import type pl from '../i18n/locales/pl.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    /** Default namespace — must match the 'translation' namespace used in i18n/index.ts */
    defaultNS: 'translation';

    resources: {
      /**
       * Polish locale is the canonical key registry.
       * All other locales (en, uk) must maintain identical key structure
       * — enforced at CI time by scripts/i18n/check-parity.ts.
       */
      translation: typeof pl;
    };
  }
}
