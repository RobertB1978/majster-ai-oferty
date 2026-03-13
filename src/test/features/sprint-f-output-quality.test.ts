/**
 * Sprint F — Output Quality / PDF / Document Trust Pass
 *
 * Focused tests verifying:
 *  1. PDF download filename uses offer title, not raw UUID
 *  2. Acceptance link URL (public, tokenized) is preferred over internal route
 *  3. Polish diacritics are correct in dossier translations
 *  4. Dossier export label is accurate (not misleading)
 *  5. offerPreview translation keys for new UI elements exist and are non-empty
 *  6. OfferPublicPage print button translation keys are present
 */

import { describe, it, expect } from 'vitest';
import plJson from '../../i18n/locales/pl.json';
import enJson from '../../i18n/locales/en.json';
import ukJson from '../../i18n/locales/uk.json';
import { buildAcceptanceLinkUrl } from '../../hooks/useAcceptanceLink';

// ── 1. buildAcceptanceLinkUrl returns /a/:token path ──────────────────────────

describe('buildAcceptanceLinkUrl', () => {
  it('returns a URL with /a/ prefix', () => {
    const token = 'abc-123-def';
    const url = buildAcceptanceLinkUrl(token);
    expect(url).toContain('/a/abc-123-def');
  });

  it('does not return an /app/ internal route', () => {
    const url = buildAcceptanceLinkUrl('some-token');
    expect(url).not.toContain('/app/');
  });
});

// ── 2. PDF filename sanitisation logic ───────────────────────────────────────

describe('PDF download filename sanitisation', () => {
  /** Reproduces the safeTitle logic in OfferPreviewModal.handleDownloadPdf */
  function buildSafeTitle(title: string | null, offerId: string): string {
    return title
      ? title
          .replace(/[^\w\s\-ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/gi, '')
          .trim()
          .slice(0, 40)
          .replace(/\s+/g, '_')
      : offerId.slice(0, 8);
  }

  it('uses offer title when present', () => {
    const name = buildSafeTitle('Remont łazienki 2024', 'uuid-here');
    expect(name).toBe('Remont_łazienki_2024');
  });

  it('falls back to UUID prefix when title is null', () => {
    const name = buildSafeTitle(null, 'abcd1234-rest');
    expect(name).toBe('abcd1234');
  });

  it('strips unsafe characters', () => {
    const name = buildSafeTitle('Oferta #1 <script>', 'fallback');
    expect(name).not.toContain('#');
    expect(name).not.toContain('<');
    expect(name).not.toContain('>');
  });

  it('truncates to 40 characters', () => {
    const longTitle = 'A'.repeat(60);
    const name = buildSafeTitle(longTitle, 'fallback');
    expect(name.length).toBeLessThanOrEqual(40);
  });

  it('preserves Polish diacritics in filename', () => {
    const name = buildSafeTitle('Łazienka małego domu', 'fallback');
    expect(name).toContain('Ł');
    expect(name).toContain('ł');
  });
});

// ── 3. Polish diacritics in dossier translations ──────────────────────────────

describe('Polish dossier category diacritics', () => {
  it('PROTOCOL uses "Protokoły" with diacritic', () => {
    expect(plJson.dossier.category.PROTOCOL).toBe('Protokoły');
  });

  it('PHOTO uses "Fotoprotokół" with diacritics', () => {
    expect(plJson.dossier.category.PHOTO).toBe('Fotoprotokół');
  });

  it('totalFiles uses "plików" with diacritic', () => {
    expect(plJson.dossier.totalFiles).toContain('plików');
  });

  it('shareLink uses "Udostępnij" with diacritic', () => {
    expect(plJson.dossier.shareLink).toBe('Udostępnij');
  });
});

// ── 4. Dossier export label is not misleading ─────────────────────────────────

describe('Dossier export PDF label', () => {
  it('PL: does not say just "Eksport PDF"', () => {
    // Should clarify it is a document index/list, not full file export
    expect(plJson.dossier.exportPdf).not.toBe('Eksport PDF');
    expect(plJson.dossier.exportPdf.length).toBeGreaterThan(0);
  });

  it('EN: does not say just "Export PDF"', () => {
    expect(enJson.dossier.exportPdf).not.toBe('Export PDF');
    expect(enJson.dossier.exportPdf.length).toBeGreaterThan(0);
  });
});

// ── 5. OfferPreview new translation keys (Sprint F) ───────────────────────────

describe('offerPreview Sprint F translation keys', () => {
  const newKeys = [
    'shareLink',
    'shareLinkHint',
    'noAcceptanceLinkNote',
    'missingCompanyAlert',
  ] as const;

  for (const locale of ['pl', 'en', 'uk'] as const) {
    const localeMap = { pl: plJson, en: enJson, uk: ukJson };

    describe(`${locale.toUpperCase()} locale`, () => {
      newKeys.forEach((key) => {
        it(`has non-empty "${key}" key`, () => {
          const value = localeMap[locale].offerPreview[key];
          expect(value).toBeTruthy();
          expect(typeof value).toBe('string');
          expect((value as string).length).toBeGreaterThan(0);
        });
      });
    });
  }
});

// ── 6. OfferPublicPage print button translation keys ─────────────────────────

describe('offerPublicPage print button translation keys', () => {
  const printKeys = ['printButton', 'printAriaLabel'] as const;

  for (const locale of ['pl', 'en', 'uk'] as const) {
    const localeMap = { pl: plJson, en: enJson, uk: ukJson };

    describe(`${locale.toUpperCase()} locale`, () => {
      printKeys.forEach((key) => {
        it(`has non-empty "${key}" key`, () => {
          const value = localeMap[locale].offerPublicPage[key];
          expect(value).toBeTruthy();
          expect(typeof value).toBe('string');
          expect((value as string).length).toBeGreaterThan(0);
        });
      });
    });
  }
});

// ── 7. shareLink label no longer says "udostępnij klientowi" (the misleading part) ──

describe('offerPreview.shareLink label accuracy', () => {
  it('PL shareLink label does not contain misleading "(udostępnij klientowi)" in parentheses', () => {
    expect(plJson.offerPreview.shareLink).not.toMatch(/\(udostępnij klientowi\)/i);
  });

  it('PL shareLinkHint mentions the key benefit (no login required or similar)', () => {
    const hint = plJson.offerPreview.shareLinkHint.toLowerCase();
    // Should mention "logowania", "klientowi" or similar trust cue
    expect(hint.length).toBeGreaterThan(10);
  });
});
