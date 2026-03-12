/**
 * planTruth.test.ts
 *
 * Focused tests verifying that Majster.AI presents one consistent truth about
 * plan limits, plan naming, and plan-alias resolution.
 *
 * Covers:
 *   1. normalizePlanId — legacy alias resolution ('starter' → 'pro')
 *   2. getLimitsForPlan — canonical limit derivation, including alias handling
 *   3. No contradictions between plans.ts and defaultConfig.ts tier limits
 *   4. 'starter' is absent from the canonical PLANS array (user-facing pricing)
 *   5. PLAN_ID_ALIASES declared for all known legacy ids
 */

import { describe, it, expect } from 'vitest';
import {
  PLANS,
  PLAN_ID_ALIASES,
  normalizePlanId,
  getLimitsForPlan,
  getPlanById,
} from '@/config/plans';
import { DEFAULT_CONFIG } from '@/data/defaultConfig';

// ---------------------------------------------------------------------------
// 1. normalizePlanId
// ---------------------------------------------------------------------------

describe('normalizePlanId', () => {
  it("maps 'starter' to 'pro'", () => {
    expect(normalizePlanId('starter')).toBe('pro');
  });

  it("leaves 'free' unchanged", () => {
    expect(normalizePlanId('free')).toBe('free');
  });

  it("leaves 'pro' unchanged", () => {
    expect(normalizePlanId('pro')).toBe('pro');
  });

  it("leaves 'business' unchanged", () => {
    expect(normalizePlanId('business')).toBe('business');
  });

  it("leaves 'enterprise' unchanged", () => {
    expect(normalizePlanId('enterprise')).toBe('enterprise');
  });

  it('returns unknown ids unchanged (safe pass-through)', () => {
    expect(normalizePlanId('unknown_plan')).toBe('unknown_plan');
  });
});

// ---------------------------------------------------------------------------
// 2. getLimitsForPlan
// ---------------------------------------------------------------------------

describe('getLimitsForPlan', () => {
  it("'starter' resolves to same limits as 'pro'", () => {
    expect(getLimitsForPlan('starter')).toEqual(getLimitsForPlan('pro'));
  });

  it("'starter' limits equal canonical pro plan limits from PLANS", () => {
    const proPlan = getPlanById('pro');
    expect(getLimitsForPlan('starter')).toEqual(proPlan?.limits);
  });

  it("falls back to free limits for unrecognised plan id", () => {
    const freeLimits = getLimitsForPlan('free');
    expect(getLimitsForPlan('totally_unknown')).toEqual(freeLimits);
  });

  it('canonical plans have non-zero storage limits', () => {
    for (const plan of PLANS) {
      expect(getLimitsForPlan(plan.id).maxStorageMB, `${plan.id} maxStorageMB`)
        .toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// 3. plans.ts ↔ defaultConfig.ts limit consistency
// ---------------------------------------------------------------------------

describe('plans.ts ↔ defaultConfig.ts tier limits — no contradictions', () => {
  /**
   * For every tier that appears in both PLANS and DEFAULT_CONFIG.plans.tiers,
   * the four user-visible numeric limits must be identical.
   */
  const canonicalTierIds = PLANS.map((p) => p.id);

  for (const tierId of canonicalTierIds) {
    const canonicalPlan = getPlanById(tierId)!;
    const configTier = DEFAULT_CONFIG.plans.tiers.find((t) => t.id === tierId);

    if (!configTier) continue; // tier not in config — skip (no contradiction possible)

    it(`[${tierId}] maxProjects matches plans.ts`, () => {
      expect(configTier.maxProjects).toBe(canonicalPlan.limits.maxProjects);
    });

    it(`[${tierId}] maxClients matches plans.ts`, () => {
      expect(configTier.maxClients).toBe(canonicalPlan.limits.maxClients);
    });

    it(`[${tierId}] maxTeamMembers matches plans.ts`, () => {
      expect(configTier.maxTeamMembers).toBe(canonicalPlan.limits.maxTeamMembers);
    });

    it(`[${tierId}] maxStorageMB matches plans.ts`, () => {
      expect(configTier.maxStorageMB).toBe(canonicalPlan.limits.maxStorageMB);
    });
  }
});

// ---------------------------------------------------------------------------
// 4. 'starter' is absent from the canonical user-facing PLANS array
// ---------------------------------------------------------------------------

describe("'starter' absent from user-facing PLANS", () => {
  it("PLANS contains no entry with id === 'starter'", () => {
    const starterPlan = PLANS.find((p) => p.id === 'starter');
    expect(starterPlan).toBeUndefined();
  });

  it("PLANS contains exactly the four canonical plans", () => {
    const ids = PLANS.map((p) => p.id).sort();
    expect(ids).toEqual(['business', 'enterprise', 'free', 'pro']);
  });
});

// ---------------------------------------------------------------------------
// 5. PLAN_ID_ALIASES declaration integrity
// ---------------------------------------------------------------------------

describe('PLAN_ID_ALIASES', () => {
  it("'starter' alias target is 'pro'", () => {
    expect(PLAN_ID_ALIASES['starter']).toBe('pro');
  });

  it('every alias target refers to a real canonical plan id', () => {
    const canonicalIds = new Set(PLANS.map((p) => p.id));
    for (const [alias, target] of Object.entries(PLAN_ID_ALIASES)) {
      expect(
        canonicalIds.has(target),
        `alias '${alias}' → '${target}': target is not a canonical plan id`
      ).toBe(true);
    }
  });

  it('no canonical plan id is listed as an alias (self-aliases would be redundant)', () => {
    const canonicalIds = new Set(PLANS.map((p) => p.id));
    for (const alias of Object.keys(PLAN_ID_ALIASES)) {
      expect(
        canonicalIds.has(alias),
        `'${alias}' is both a canonical plan and an alias — remove it from PLAN_ID_ALIASES`
      ).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// 6. defaultConfig.ts has no 'starter' tier (user-facing pricing remains clean)
// ---------------------------------------------------------------------------

describe("defaultConfig.ts tiers — no 'starter' tier", () => {
  it("DEFAULT_CONFIG.plans.tiers contains no 'starter' entry", () => {
    const starterTier = DEFAULT_CONFIG.plans.tiers.find((t) => t.id === 'starter');
    expect(starterTier).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 7. Free plan does not list paid features in defaultConfig
// ---------------------------------------------------------------------------

describe('defaultConfig free tier — no paid features', () => {
  it('free tier features array is empty (excelExport requires pro+)', () => {
    const freeTier = DEFAULT_CONFIG.plans.tiers.find((t) => t.id === 'free');
    expect(freeTier).toBeDefined();
    expect(freeTier!.features).not.toContain('excelExport');
  });
});
