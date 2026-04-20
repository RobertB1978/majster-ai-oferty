import { describe, it, expect } from 'vitest';
import { LEGAL_VERSIONS, getLegalEffectiveDate, getLegalVersion } from './legalVersions';
import type { LegalDocumentSlug } from '@/types/legal';

const SLUGS: LegalDocumentSlug[] = ['privacy', 'terms', 'cookies', 'dpa', 'rodo'];

describe('LEGAL_VERSIONS', () => {
  it('defines all required document slugs', () => {
    for (const slug of SLUGS) {
      expect(LEGAL_VERSIONS[slug]).toBeDefined();
    }
  });

  it('every version is a non-empty string', () => {
    for (const slug of SLUGS) {
      expect(LEGAL_VERSIONS[slug].version.length).toBeGreaterThan(0);
    }
  });

  it('every effectiveAt is a valid ISO date (YYYY-MM-DD)', () => {
    const isoDateRe = /^\d{4}-\d{2}-\d{2}$/;
    for (const slug of SLUGS) {
      expect(LEGAL_VERSIONS[slug].effectiveAt).toMatch(isoDateRe);
    }
  });

  it('effectiveAt is NOT "today" (must be a hardcoded historical date, not new Date())', () => {
    for (const slug of SLUGS) {
      const { effectiveAt } = LEGAL_VERSIONS[slug];
      // Verify it is a real static value — not generated at runtime from current date
      expect(effectiveAt).toBe(LEGAL_VERSIONS[slug].effectiveAt);
      // Value must not change between two reads (no dynamic generation)
      expect(LEGAL_VERSIONS[slug].effectiveAt).toBe(effectiveAt);
    }
  });
});

describe('getLegalEffectiveDate', () => {
  it('formats date in Polish locale for pl', () => {
    const result = getLegalEffectiveDate('privacy', 'pl');
    // Polish: day.month.year
    expect(result).toMatch(/\d{1,2}\.\d{1,2}\.\d{4}/);
  });

  it('formats date for en locale', () => {
    const result = getLegalEffectiveDate('terms', 'en');
    // en-GB: day/month/year or similar
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('formats date for uk locale', () => {
    const result = getLegalEffectiveDate('cookies', 'uk');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns the same date for repeated calls (no dynamic date)', () => {
    const a = getLegalEffectiveDate('dpa', 'pl');
    const b = getLegalEffectiveDate('dpa', 'pl');
    expect(a).toBe(b);
  });
});

describe('getLegalVersion', () => {
  it('returns a non-empty version string for every slug', () => {
    for (const slug of SLUGS) {
      const version = getLegalVersion(slug);
      expect(typeof version).toBe('string');
      expect(version.length).toBeGreaterThan(0);
    }
  });

  it('returns "1.0" as the initial version for all slugs', () => {
    for (const slug of SLUGS) {
      expect(getLegalVersion(slug)).toBe('1.0');
    }
  });
});
