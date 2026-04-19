/**
 * PR-COMM-02 — Send Gate Completeness
 *
 * Verifies the hardened SEND transition:
 *  1. validateSenderProfileForSend returns valid only when all 5 fields are present
 *  2. validateSenderProfileForSend returns missingFields for each absent field
 *  3. null/undefined profile is treated as fully missing
 *  4. Partial profile correctly lists only missing fields
 *  5. offerPdfPayloadBuilder no longer contains 'Majster.AI' fallback
 *  6. OfferPreviewModal source: recipientEmail state + useEffect auto-fill
 *  7. OfferPreviewModal source: handleSend checks client + profile before quota
 *  8. OfferPreviewModal source: send button disabled when client missing
 *  9. i18n keys for send-gate errors exist in PL / EN / UK
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { validateSenderProfileForSend } from '@/lib/validations';

function readSrc(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf-8');
}

// ── 1. validateSenderProfileForSend — core logic ─────────────────────────────

describe('validateSenderProfileForSend — core logic', () => {
  const FULL_PROFILE = {
    company_name: 'Acme Sp. z o.o.',
    nip: '1234567890',
    street: 'ul. Testowa 1',
    postal_code: '00-001',
    city: 'Warszawa',
  };

  it('returns valid=true when all 5 required fields are present', () => {
    const result = validateSenderProfileForSend(FULL_PROFILE);
    expect(result.valid).toBe(true);
    expect(result.missingFields).toHaveLength(0);
  });

  it('returns valid=false and lists company_name when it is missing', () => {
    const result = validateSenderProfileForSend({ ...FULL_PROFILE, company_name: '' });
    expect(result.valid).toBe(false);
    expect(result.missingFields).toContain('company_name');
  });

  it('returns valid=false and lists nip when it is missing', () => {
    const result = validateSenderProfileForSend({ ...FULL_PROFILE, nip: null });
    expect(result.valid).toBe(false);
    expect(result.missingFields).toContain('nip');
  });

  it('returns valid=false and lists street when it is missing', () => {
    const result = validateSenderProfileForSend({ ...FULL_PROFILE, street: '   ' });
    expect(result.valid).toBe(false);
    expect(result.missingFields).toContain('street');
  });

  it('returns valid=false and lists postal_code when it is missing', () => {
    const result = validateSenderProfileForSend({ ...FULL_PROFILE, postal_code: undefined });
    expect(result.valid).toBe(false);
    expect(result.missingFields).toContain('postal_code');
  });

  it('returns valid=false and lists city when it is missing', () => {
    const result = validateSenderProfileForSend({ ...FULL_PROFILE, city: null });
    expect(result.valid).toBe(false);
    expect(result.missingFields).toContain('city');
  });

  it('returns all 5 missing fields when profile is null', () => {
    const result = validateSenderProfileForSend(null);
    expect(result.valid).toBe(false);
    expect(result.missingFields).toHaveLength(5);
  });

  it('returns all 5 missing fields when profile is undefined', () => {
    const result = validateSenderProfileForSend(undefined);
    expect(result.valid).toBe(false);
    expect(result.missingFields).toHaveLength(5);
  });

  it('returns only missing fields for a partial profile', () => {
    const result = validateSenderProfileForSend({
      company_name: 'Firma',
      nip: '1234567890',
      street: null,
      postal_code: null,
      city: null,
    });
    expect(result.valid).toBe(false);
    expect(result.missingFields).toEqual(
      expect.arrayContaining(['street', 'postal_code', 'city'])
    );
    expect(result.missingFields).not.toContain('company_name');
    expect(result.missingFields).not.toContain('nip');
  });

  it('whitespace-only values are treated as missing', () => {
    const result = validateSenderProfileForSend({
      company_name: '   ',
      nip: '\t',
      street: '',
      postal_code: ' ',
      city: '',
    });
    expect(result.valid).toBe(false);
    expect(result.missingFields).toHaveLength(5);
  });
});

// ── 2. offerPdfPayloadBuilder — no 'Majster.AI' fallback ─────────────────────

describe('offerPdfPayloadBuilder — Majster.AI fallback removed', () => {
  it('source code does NOT contain the Majster.AI string fallback', () => {
    const source = readSrc('src/lib/offerPdfPayloadBuilder.ts');
    expect(source).not.toContain("'Majster.AI'");
    expect(source).not.toContain('"Majster.AI"');
  });
});

// ── 3. OfferPreviewModal — structural validation ──────────────────────────────

describe('OfferPreviewModal — send gate structural checks', () => {
  it('imports validateSenderProfileForSend from validations', () => {
    const source = readSrc('src/components/offers/OfferPreviewModal.tsx');
    expect(source).toContain('validateSenderProfileForSend');
    expect(source).toContain("from '@/lib/validations'");
  });

  it('has recipientEmail state', () => {
    const source = readSrc('src/components/offers/OfferPreviewModal.tsx');
    expect(source).toContain('recipientEmail');
    expect(source).toContain('setRecipientEmail');
  });

  it('uses useEffect to auto-fill recipient email from client', () => {
    const source = readSrc('src/components/offers/OfferPreviewModal.tsx');
    expect(source).toContain('useEffect');
    expect(source).toContain("data?.client?.email");
    expect(source).toContain('setRecipientEmail');
  });

  it('handleSend blocks when client is missing (checks !data.client)', () => {
    const source = readSrc('src/components/offers/OfferPreviewModal.tsx');
    expect(source).toContain('!data.client');
    expect(source).toContain("t('offerPreview.sendBlockedNoClient')");
  });

  it('handleSend blocks when sender profile minimum is incomplete', () => {
    const source = readSrc('src/components/offers/OfferPreviewModal.tsx');
    expect(source).toContain('profileCheck');
    expect(source).toContain('!profileCheck.valid');
    expect(source).toContain("t('offerPreview.sendBlockedIncompleteProfile')");
  });

  it('send button disabled prop includes !data.client check', () => {
    const source = readSrc('src/components/offers/OfferPreviewModal.tsx');
    // The disabled prop on the send button must gate on missing client
    expect(source).toContain('!data.client');
  });

  it('send button disabled prop includes validateSenderProfileForSend check', () => {
    const source = readSrc('src/components/offers/OfferPreviewModal.tsx');
    expect(source).toContain('!validateSenderProfileForSend(data.company).valid');
  });

  it('renders Input for recipient email when client is present', () => {
    const source = readSrc('src/components/offers/OfferPreviewModal.tsx');
    expect(source).toContain('recipientEmailLabel');
    expect(source).toContain('recipientEmailPlaceholder');
    expect(source).toContain('type="email"');
  });

  it('sends recipientEmail state value (not raw client.email)', () => {
    const source = readSrc('src/components/offers/OfferPreviewModal.tsx');
    // Must use the state value, not data.client?.email directly
    expect(source).toContain('recipientEmail.trim()');
    // Must NOT pass data.client?.email directly to sendOffer.mutate
    expect(source).not.toContain('clientEmail: data.client?.email');
  });

  it('Input component is imported', () => {
    const source = readSrc('src/components/offers/OfferPreviewModal.tsx');
    expect(source).toContain("import { Input }");
  });
});

// ── 4. i18n — send-gate keys present in all locales ──────────────────────────

describe('i18n — send-gate keys exist in PL / EN / UK', () => {
  const localeFiles = [
    { lang: 'pl', path: 'src/i18n/locales/pl.json' },
    { lang: 'en', path: 'src/i18n/locales/en.json' },
    { lang: 'uk', path: 'src/i18n/locales/uk.json' },
  ];

  for (const { lang, path } of localeFiles) {
    it(`${lang}: sendBlockedNoClient key exists`, () => {
      const source = readSrc(path);
      expect(source, `${lang} must have sendBlockedNoClient`).toContain('"sendBlockedNoClient"');
    });

    it(`${lang}: sendBlockedIncompleteProfile key exists`, () => {
      const source = readSrc(path);
      expect(source, `${lang} must have sendBlockedIncompleteProfile`).toContain('"sendBlockedIncompleteProfile"');
    });

    it(`${lang}: recipientEmailLabel key exists`, () => {
      const source = readSrc(path);
      expect(source, `${lang} must have recipientEmailLabel`).toContain('"recipientEmailLabel"');
    });

    it(`${lang}: recipientEmailPlaceholder key exists`, () => {
      const source = readSrc(path);
      expect(source, `${lang} must have recipientEmailPlaceholder`).toContain('"recipientEmailPlaceholder"');
    });
  }
});

// ── 5. Draft compatibility — validation only on SEND ─────────────────────────

describe('Draft compatibility — validateSenderProfileForSend is SEND-only', () => {
  it('validateSenderProfileForSend is NOT called in useSendOffer (validation is UI-layer)', () => {
    const source = readSrc('src/hooks/useSendOffer.ts');
    // The hook itself must NOT import or call validateSenderProfileForSend
    // (validation is enforced at the UI layer in OfferPreviewModal, not here)
    expect(source).not.toContain('validateSenderProfileForSend');
  });

  it('useSendOffer remains callable without client validation (backward compat)', () => {
    const source = readSrc('src/hooks/useSendOffer.ts');
    // clientEmail is still optional — drafts and tests can still call without it
    expect(source).toContain('clientEmail?: string');
  });
});
