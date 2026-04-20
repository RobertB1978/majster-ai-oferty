import type { LegalDocumentSlug } from '@/types/legal';

/**
 * Static source of truth for legal document versions.
 *
 * These values are set when a document is actually published/updated.
 * They must NOT be generated dynamically (e.g. new Date()) because
 * that would claim a document changed on every page render.
 *
 * PR-L2 will replace this static map with a live fetch from
 * the legal_documents table (slug + language → effective_at + version).
 */
export const LEGAL_VERSIONS: Record<
  LegalDocumentSlug,
  { version: string; effectiveAt: string }
> = {
  privacy: { version: '1.0', effectiveAt: '2026-04-20' },
  terms:   { version: '1.0', effectiveAt: '2026-04-20' },
  cookies: { version: '1.0', effectiveAt: '2026-04-20' },
  dpa:     { version: '1.0', effectiveAt: '2026-04-20' },
  rodo:    { version: '1.0', effectiveAt: '2026-04-20' },
};

/**
 * Returns the formatted effective date for a legal document.
 *
 * Uses the static LEGAL_VERSIONS map. Locale is passed from the
 * calling component so we stay consistent with the UI locale.
 *
 * @param slug   - document identifier (privacy|terms|cookies|dpa|rodo)
 * @param locale - i18n language code (pl|en|uk)
 */
export function getLegalEffectiveDate(slug: LegalDocumentSlug, locale: string): string {
  const { effectiveAt } = LEGAL_VERSIONS[slug];
  const [year, month, day] = effectiveAt.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const localeStr =
    locale === 'pl' ? 'pl-PL' :
    locale === 'uk' ? 'uk-UA' :
    'en-GB';
  return date.toLocaleDateString(localeStr);
}

/**
 * Returns the version string for a legal document.
 */
export function getLegalVersion(slug: LegalDocumentSlug): string {
  return LEGAL_VERSIONS[slug].version;
}
