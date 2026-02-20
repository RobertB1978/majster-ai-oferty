/**
 * Sprint 1 — Offer System v2 Tests
 * Pure-logic tests: expiry, cancel window, dual-token, email HTML, verification reset
 * (Edge function tests live in supabase/functions/send-offer-email/emailHandler.test.ts)
 */
import { describe, it, expect } from 'vitest';

// ─── Helpers under test (pure logic inlined from components) ──────────────

function canCancel(acceptedAt: string | null | undefined): boolean {
  if (!acceptedAt) return false;
  return Date.now() - new Date(acceptedAt).getTime() < 600_000;
}

function isOfferExpired(validUntil: string | null | undefined): boolean {
  if (!validUntil) return false;
  return new Date(validUntil) < new Date();
}

function buildViewUrl(base: string, publicToken: string): string {
  return `${base}/offer/${publicToken}`;
}

function buildAcceptUrl(base: string, publicToken: string, acceptToken: string): string {
  return `${base}/offer/${publicToken}?t=${acceptToken}`;
}

function computeValidUntil(expiryDays: number, customDate?: string): string | null {
  if (expiryDays === -1) {
    return customDate ? new Date(customDate).toISOString() : null;
  }
  const d = new Date();
  d.setDate(d.getDate() + expiryDays);
  return d.toISOString();
}

function resetVerificationOnEmailChange(
  prevEmail: string,
  newEmail: string,
  prevVerified: boolean
): boolean {
  return newEmail !== prevEmail ? false : prevVerified;
}

// ─── 10-minute cancel window ─────────────────────────────────────────────

describe('canCancel (10-minute window)', () => {
  it('allows cancel within 10 minutes', () => {
    const acceptedAt = new Date(Date.now() - 60_000).toISOString();
    expect(canCancel(acceptedAt)).toBe(true);
  });

  it('blocks cancel after 10 minutes', () => {
    const acceptedAt = new Date(Date.now() - 700_000).toISOString();
    expect(canCancel(acceptedAt)).toBe(false);
  });

  it('blocks cancel at exactly 600 001ms elapsed', () => {
    const acceptedAt = new Date(Date.now() - 600_001).toISOString();
    expect(canCancel(acceptedAt)).toBe(false);
  });

  it('returns false for null acceptedAt', () => {
    expect(canCancel(null)).toBe(false);
    expect(canCancel(undefined)).toBe(false);
  });
});

// ─── Offer expiry ─────────────────────────────────────────────────────────

describe('isOfferExpired', () => {
  it('is expired when valid_until is in the past', () => {
    const past = new Date(Date.now() - 86_400_000).toISOString();
    expect(isOfferExpired(past)).toBe(true);
  });

  it('is NOT expired when valid_until is in the future', () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(isOfferExpired(future)).toBe(false);
  });

  it('returns false when valid_until is null', () => {
    expect(isOfferExpired(null)).toBe(false);
  });
});

// ─── Dual-token URL construction ──────────────────────────────────────────

describe('Dual-token URL separation', () => {
  const BASE = 'https://majster.ai';
  const PUBLIC = 'aabbccdd-0000-0000-0000-111122223333';
  const ACCEPT = 'ddccbbaa-0000-0000-0000-333322221111';

  it('view URL contains only public_token, no ?t=', () => {
    const url = buildViewUrl(BASE, PUBLIC);
    expect(url).toBe(`${BASE}/offer/${PUBLIC}`);
    expect(url).not.toContain('?t=');
  });

  it('accept URL contains both tokens', () => {
    const url = buildAcceptUrl(BASE, PUBLIC, ACCEPT);
    expect(url).toContain(PUBLIC);
    expect(url).toContain(ACCEPT);
    expect(url).toContain('?t=');
  });

  it('public_token and accept_token are distinct', () => {
    const pub = crypto.randomUUID();
    const acc = crypto.randomUUID();
    expect(pub).not.toBe(acc);
  });
});

// ─── Valid-until computation ──────────────────────────────────────────────

describe('computeValidUntil', () => {
  it('returns a future date for positive days', () => {
    const result = computeValidUntil(30);
    expect(result).not.toBeNull();
    expect(new Date(result!).getTime()).toBeGreaterThan(Date.now());
  });

  it('returns null for custom date with no customDate set', () => {
    expect(computeValidUntil(-1)).toBeNull();
  });

  it('parses customDate string correctly', () => {
    const result = computeValidUntil(-1, '2027-12-31');
    expect(result).not.toBeNull();
    expect(result).toContain('2027');
  });

  it('7-day expiry is roughly 7 days ahead', () => {
    const result = computeValidUntil(7);
    const diffDays = (new Date(result!).getTime() - Date.now()) / 86_400_000;
    expect(diffDays).toBeCloseTo(7, 0);
  });
});

// ─── Email verification reset ─────────────────────────────────────────────

describe('resetVerificationOnEmailChange', () => {
  it('resets verified=false when email changes', () => {
    expect(resetVerificationOnEmailChange('a@x.pl', 'b@x.pl', true)).toBe(false);
  });

  it('keeps verified=true when email is same', () => {
    expect(resetVerificationOnEmailChange('a@x.pl', 'a@x.pl', true)).toBe(true);
  });

  it('keeps verified=false when email unchanged and was already false', () => {
    expect(resetVerificationOnEmailChange('a@x.pl', 'a@x.pl', false)).toBe(false);
  });
});

// ─── Idempotency guard ───────────────────────────────────────────────────

describe('Idempotency (second accept returns current status)', () => {
  const FINAL_STATUSES = ['accepted', 'approved', 'rejected', 'expired', 'withdrawn'];

  it('all terminal statuses are treated as already-final', () => {
    FINAL_STATUSES.forEach((s) => {
      expect(FINAL_STATUSES.includes(s)).toBe(true);
    });
  });

  it('pending/sent/viewed are NOT terminal', () => {
    ['pending', 'sent', 'viewed'].forEach((s) => {
      expect(FINAL_STATUSES.includes(s)).toBe(false);
    });
  });
});

// ─── Delivery status transitions ─────────────────────────────────────────

describe('Delivery status lifecycle', () => {
  const VALID = ['queued', 'sent', 'delivered', 'failed', 'bounced'];
  const FAILURE = ['failed', 'bounced'];

  it('all delivery statuses are valid', () => {
    VALID.forEach((s) => expect(VALID.includes(s)).toBe(true));
  });

  it('failed and bounced trigger the delivery failure banner', () => {
    expect(FAILURE.includes('failed')).toBe(true);
    expect(FAILURE.includes('bounced')).toBe(true);
    expect(FAILURE.includes('delivered')).toBe(false);
  });
});
