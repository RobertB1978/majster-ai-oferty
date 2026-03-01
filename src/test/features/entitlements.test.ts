/**
 * Unit tests for PR-06: Free-plan monthly offer quota entitlements.
 *
 * Tests cover:
 *   1. canSendOffer() — pure gating function
 *   2. remainingOfferQuota() — remaining quota calculation
 *   3. FREE_TIER_OFFER_LIMIT constant is exactly 3
 *   4. FINALIZED_OFFER_STATUSES matches ADR-0004 (sent | accepted | rejected)
 *   5. Draft changes do NOT affect the quota (drafts are not in FINALIZED_OFFER_STATUSES)
 *   6. Paid plans are never blocked
 *
 * ADR: docs/ADR/ADR-0004-free-tier-limit.md
 */

import { describe, it, expect } from 'vitest';
import {
  canSendOffer,
  remainingOfferQuota,
  FREE_TIER_OFFER_LIMIT,
  FINALIZED_OFFER_STATUSES,
} from '@/config/entitlements';

// ---------------------------------------------------------------------------
// Constants contract
// ---------------------------------------------------------------------------

describe('FREE_TIER_OFFER_LIMIT', () => {
  it('is exactly 3 (ADR-0004 decision)', () => {
    expect(FREE_TIER_OFFER_LIMIT).toBe(3);
  });
});

describe('FINALIZED_OFFER_STATUSES', () => {
  it('includes sent, accepted, rejected', () => {
    expect(FINALIZED_OFFER_STATUSES).toContain('sent');
    expect(FINALIZED_OFFER_STATUSES).toContain('accepted');
    expect(FINALIZED_OFFER_STATUSES).toContain('rejected');
  });

  it('does NOT include draft — drafts never consume quota', () => {
    expect(FINALIZED_OFFER_STATUSES).not.toContain('draft');
  });

  it('does NOT include pending, viewed, expired, withdrawn', () => {
    const nonFinalStatuses = ['pending', 'viewed', 'expired', 'withdrawn'];
    nonFinalStatuses.forEach((s) => {
      expect(FINALIZED_OFFER_STATUSES).not.toContain(s);
    });
  });
});

// ---------------------------------------------------------------------------
// canSendOffer()
// ---------------------------------------------------------------------------

describe('canSendOffer()', () => {
  describe('free plan', () => {
    it('allows send at 0/3 used', () => {
      expect(canSendOffer('free', 0)).toBe(true);
    });

    it('allows send at 1/3 used', () => {
      expect(canSendOffer('free', 1)).toBe(true);
    });

    it('allows send at 2/3 used', () => {
      expect(canSendOffer('free', 2)).toBe(true);
    });

    it('BLOCKS send at 3/3 used (limit reached)', () => {
      expect(canSendOffer('free', 3)).toBe(false);
    });

    it('BLOCKS send when monthlyUsed exceeds limit (e.g. 4)', () => {
      expect(canSendOffer('free', 4)).toBe(false);
    });

    it('draft changes do NOT affect canSend — drafts are not counted', () => {
      // Draft statuses are never passed to canSendOffer; the quota
      // only counts sent|accepted|rejected offers from the DB function.
      // With 0 finalized offers, even 100 drafts have no effect.
      const monthlyFinalizedOffers = 0; // 100 drafts exist but are not counted
      expect(canSendOffer('free', monthlyFinalizedOffers)).toBe(true);
    });
  });

  describe('paid plans', () => {
    const paidPlans = ['pro', 'starter', 'business', 'enterprise'];

    paidPlans.forEach((plan) => {
      it(`always allows send on ${plan} plan regardless of count`, () => {
        expect(canSendOffer(plan, 0)).toBe(true);
        expect(canSendOffer(plan, 3)).toBe(true);
        expect(canSendOffer(plan, 100)).toBe(true);
      });
    });

    it('unknown plan is treated as paid (safe default)', () => {
      // Any plan string that is not 'free' is treated as non-free
      expect(canSendOffer('ultra', 3)).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// remainingOfferQuota()
// ---------------------------------------------------------------------------

describe('remainingOfferQuota()', () => {
  describe('free plan', () => {
    it('returns 3 when 0 used', () => {
      expect(remainingOfferQuota('free', 0)).toBe(3);
    });

    it('returns 2 when 1 used', () => {
      expect(remainingOfferQuota('free', 1)).toBe(2);
    });

    it('returns 1 when 2 used', () => {
      expect(remainingOfferQuota('free', 2)).toBe(1);
    });

    it('returns 0 when 3 used (limit reached)', () => {
      expect(remainingOfferQuota('free', 3)).toBe(0);
    });

    it('never goes below 0 even if somehow over limit', () => {
      expect(remainingOfferQuota('free', 5)).toBe(0);
    });
  });

  describe('paid plans', () => {
    it('returns Infinity for pro plan', () => {
      expect(remainingOfferQuota('pro', 100)).toBe(Infinity);
    });

    it('returns Infinity for enterprise plan', () => {
      expect(remainingOfferQuota('enterprise', 9999)).toBe(Infinity);
    });
  });
});

// ---------------------------------------------------------------------------
// Boundary scenarios (ADR edge cases)
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
  it('quota resets each month — function is stateless, count comes from DB', () => {
    // The function itself is pure and stateless.
    // Monthly reset is enforced by the DB function count_monthly_finalized_offers()
    // which filters by created_at >= date_trunc('month', NOW() AT TIME ZONE 'UTC').
    // With a fresh month, monthlyUsed = 0.
    expect(canSendOffer('free', 0)).toBe(true); // new month, 0 used
  });

  it('send at exactly the limit boundary (2 used, adding 3rd is allowed)', () => {
    // User has sent 2 this month — they CAN send 1 more (would be their 3rd)
    expect(canSendOffer('free', 2)).toBe(true);
  });

  it('send AFTER limit boundary (3 used, 4th is blocked)', () => {
    // User has sent 3 this month — they are BLOCKED from sending a 4th
    expect(canSendOffer('free', 3)).toBe(false);
  });
});
