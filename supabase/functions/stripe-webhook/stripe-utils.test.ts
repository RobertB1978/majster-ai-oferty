// ============================================================================
// Tests for stripe-utils.ts
//
// These tests run under Vitest (jsdom) because stripe-utils.ts contains only
// pure TypeScript with no Deno or ESM-URL imports.
// ============================================================================

import { describe, it, expect } from "vitest";
import { mapSubscriptionStatus, isEntitledStatus } from "./stripe-utils";

// ---------------------------------------------------------------------------
// mapSubscriptionStatus
// ---------------------------------------------------------------------------

describe("mapSubscriptionStatus", () => {
  // Known Stripe statuses that SHOULD grant entitlements
  it('maps "active" → "active"', () => {
    expect(mapSubscriptionStatus("active")).toBe("active");
  });

  it('maps "trialing" → "trial"', () => {
    expect(mapSubscriptionStatus("trialing")).toBe("trial");
  });

  // Known Stripe statuses that should NOT grant entitlements
  it('maps "canceled" → "cancelled"', () => {
    // Stripe uses American spelling "canceled"
    expect(mapSubscriptionStatus("canceled")).toBe("cancelled");
  });

  it('maps "unpaid" → "cancelled"', () => {
    expect(mapSubscriptionStatus("unpaid")).toBe("cancelled");
  });

  it('maps "past_due" → "expired"', () => {
    expect(mapSubscriptionStatus("past_due")).toBe("expired");
  });

  it('maps "incomplete_expired" → "expired"', () => {
    expect(mapSubscriptionStatus("incomplete_expired")).toBe("expired");
  });

  // -------------------------------------------------------------------------
  // SECURITY: unknown / future statuses MUST map to least privilege
  // -------------------------------------------------------------------------

  it('maps unknown status "incomplete" → "inactive" (least privilege)', () => {
    expect(mapSubscriptionStatus("incomplete")).toBe("inactive");
  });

  it('maps unknown status "paused" → "inactive" (least privilege)', () => {
    expect(mapSubscriptionStatus("paused")).toBe("inactive");
  });

  it('maps completely unknown string → "inactive" (least privilege)', () => {
    expect(mapSubscriptionStatus("some_future_stripe_status")).toBe("inactive");
  });

  it('maps empty string → "inactive" (least privilege)', () => {
    expect(mapSubscriptionStatus("")).toBe("inactive");
  });

  // Regression: the original code returned "active" for the default case,
  // which would grant entitlements to unknown statuses. Verify the fix.
  it("REGRESSION: default case MUST NOT return active or trial", () => {
    const unknownStatuses = ["", "paused", "incomplete", "whatever"];
    unknownStatuses.forEach((s) => {
      const result = mapSubscriptionStatus(s);
      expect(result, `Status "${s}" must not grant access`).not.toBe("active");
      expect(result, `Status "${s}" must not grant access`).not.toBe("trial");
    });
  });
});

// ---------------------------------------------------------------------------
// isEntitledStatus
// ---------------------------------------------------------------------------

describe("isEntitledStatus", () => {
  it('returns true for "active"', () => {
    expect(isEntitledStatus("active")).toBe(true);
  });

  it('returns true for "trial"', () => {
    expect(isEntitledStatus("trial")).toBe(true);
  });

  it('returns false for "inactive"', () => {
    expect(isEntitledStatus("inactive")).toBe(false);
  });

  it('returns false for "cancelled"', () => {
    expect(isEntitledStatus("cancelled")).toBe(false);
  });

  it('returns false for "expired"', () => {
    expect(isEntitledStatus("expired")).toBe(false);
  });

  it("returns false for unknown statuses", () => {
    expect(isEntitledStatus("whatever")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Idempotency logic — tested via the claimEvent contract
//
// claimEvent is part of the Deno handler (requires Supabase client), so we
// test the contract using a lightweight mock that mirrors the real behaviour.
// ---------------------------------------------------------------------------

/**
 * Minimal in-memory replica of the stripe_events table PRIMARY KEY behaviour.
 * Mirrors claimEvent: returns true on first insert, false on duplicate.
 */
function makeIdempotencyStore() {
  const seen = new Set<string>();

  return {
    claim(eventId: string): boolean {
      if (seen.has(eventId)) return false;
      seen.add(eventId);
      return true;
    },
  };
}

describe("Idempotency store contract", () => {
  it("first claim of a new event_id returns true (process it)", () => {
    const store = makeIdempotencyStore();
    expect(store.claim("evt_001")).toBe(true);
  });

  it("second claim of the same event_id returns false (skip it)", () => {
    const store = makeIdempotencyStore();
    store.claim("evt_001");
    expect(store.claim("evt_001")).toBe(false);
  });

  it("duplicate event produces exactly ONE side-effect", () => {
    const store = makeIdempotencyStore();
    let sideEffectCount = 0;

    function processEvent(eventId: string) {
      if (!store.claim(eventId)) return; // already processed
      sideEffectCount += 1;
    }

    // Deliver the same event three times (Stripe retry behaviour)
    processEvent("evt_duplicate_test");
    processEvent("evt_duplicate_test");
    processEvent("evt_duplicate_test");

    expect(sideEffectCount).toBe(1);
  });

  it("different event IDs each claim successfully", () => {
    const store = makeIdempotencyStore();
    expect(store.claim("evt_aaa")).toBe(true);
    expect(store.claim("evt_bbb")).toBe(true);
    expect(store.claim("evt_ccc")).toBe(true);
  });

  it("unknown Stripe status never grants active entitlements (combined test)", () => {
    // Simulates what happens when a webhook with unknown status arrives:
    // 1. It is new (idempotency claim succeeds)
    // 2. The mapped status must not be entitlement-granting
    const store = makeIdempotencyStore();
    const eventId = "evt_future_status";

    const isNew = store.claim(eventId);
    expect(isNew).toBe(true);

    const mappedStatus = mapSubscriptionStatus("some_future_stripe_status");
    expect(isEntitledStatus(mappedStatus)).toBe(false);
  });
});
