import { describe, it, expect } from 'vitest';
import { PLANS, getPlanById, getPlanBySlug } from '@/config/plans';
import { formatDualCurrency, DEFAULT_PLN_EUR_RATE } from '@/config/currency';

/**
 * P0 — Plans SoT + Dual Currency Tests
 *
 * Asserts that:
 *   1. PLANS is the single source of truth — prices are consistent.
 *   2. formatDualCurrency returns both PLN and EUR for every locale.
 */

describe('PLANS — single source of truth', () => {
  it('Pro pricePLN is 49', () => {
    const pro = getPlanById('pro');
    expect(pro).toBeDefined();
    expect(pro!.pricePLN).toBe(49);
  });

  it('Biznes / Business pricePLN is 99', () => {
    const biz = getPlanById('business');
    expect(biz).toBeDefined();
    expect(biz!.pricePLN).toBe(99);
  });

  it('Enterprise pricePLN is 199', () => {
    const ent = getPlanById('enterprise');
    expect(ent).toBeDefined();
    expect(ent!.pricePLN).toBe(199);
  });

  it('Free / Darmowy pricePLN is 0', () => {
    const free = getPlanById('free');
    expect(free).toBeDefined();
    expect(free!.pricePLN).toBe(0);
  });

  it('all plans have required fields', () => {
    for (const plan of PLANS) {
      expect(plan.slug).toBeTruthy();
      expect(plan.id).toBeTruthy();
      expect(plan.displayNameKey).toMatch(/^billing\.plans\./);
      expect(plan.descriptionKey).toMatch(/^billing\.plans\./);
      expect(plan.featuresKeys.length).toBeGreaterThan(0);
      expect(plan.limits).toBeDefined();
      expect(typeof plan.limits.maxProjects).toBe('number');
      expect(typeof plan.limits.maxStorageMB).toBe('number');
      expect(plan.stripePriceId === null || typeof plan.stripePriceId === 'string').toBe(true);
    }
  });

  it('getPlanBySlug("pro") resolves to the same plan as getPlanById("pro")', () => {
    const bySlug = getPlanBySlug('pro');
    const byId = getPlanById('pro');
    expect(bySlug).toBe(byId);
  });

  it('no two plans share the same pricePLN (except 0 is unique)', () => {
    const prices = PLANS.filter(p => p.pricePLN > 0).map(p => p.pricePLN);
    const unique = new Set(prices);
    expect(unique.size).toBe(prices.length);
  });
});

describe('formatDualCurrency', () => {
  const rate = DEFAULT_PLN_EUR_RATE; // 0.23
  const proPrice = 49;
  const expectedEUR = Math.round(proPrice * rate); // 11

  it('PL locale shows PLN first: "49 zł • €11"', () => {
    expect(formatDualCurrency(proPrice, 'pl')).toBe(`${proPrice} zł • €${expectedEUR}`);
  });

  it('EN locale shows EUR first: "€11 • 49 PLN"', () => {
    expect(formatDualCurrency(proPrice, 'en')).toBe(`€${expectedEUR} • ${proPrice} PLN`);
  });

  it('UK locale shows EUR first (same as EN)', () => {
    expect(formatDualCurrency(proPrice, 'uk')).toBe(`€${expectedEUR} • ${proPrice} PLN`);
  });

  it('free plan returns "Gratis" for PL locale', () => {
    expect(formatDualCurrency(0, 'pl')).toBe('Gratis');
  });

  it('free plan returns "Free" for EN locale', () => {
    expect(formatDualCurrency(0, 'en')).toBe('Free');
  });

  it('free plan returns "Free" for UK locale', () => {
    expect(formatDualCurrency(0, 'uk')).toBe('Free');
  });

  it('99 PLN → correct EUR for PL locale', () => {
    const eur = Math.round(99 * rate);
    expect(formatDualCurrency(99, 'pl')).toBe(`99 zł • €${eur}`);
  });

  it('199 PLN → correct EUR for EN locale', () => {
    const eur = Math.round(199 * rate);
    expect(formatDualCurrency(199, 'en')).toBe(`€${eur} • 199 PLN`);
  });

  it('Pro price from PLANS matches formatter assumption', () => {
    const pro = getPlanById('pro')!;
    // PL locale: should contain PLN amount
    expect(formatDualCurrency(pro.pricePLN, 'pl')).toContain('49 zł');
    // EN locale: should contain EUR and PLN
    expect(formatDualCurrency(pro.pricePLN, 'en')).toContain('49 PLN');
    expect(formatDualCurrency(pro.pricePLN, 'en')).toContain('€');
  });
});
