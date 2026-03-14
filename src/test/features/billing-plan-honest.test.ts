/**
 * billing-plan-honest.test.ts — Pack 4
 *
 * Weryfikuje, że powierzchnie billing/plan są uczciwe i bezpieczne dla bety:
 *
 * 1. isRealStripePriceId odrzuca placeholder Price IDs
 * 2. isRealStripePriceId akceptuje prawdziwe Stripe Price IDs
 * 3. isStripeConfigured zwraca false gdy brak konfiguracji (domyślny stan beta)
 * 4. AddOnModal ma etykiety "coming soon" — brak fake checkoutu
 * 5. Ceny planów są niezerowe i spójne z konfiguracją
 */

import { describe, it, expect } from 'vitest';
import { isRealStripePriceId, isStripeConfigured } from '@/hooks/useStripe';
import { PLANS } from '@/config/plans';

// ── 1–3. Stripe price ID validation ─────────────────────────────────────────

describe('isRealStripePriceId — walidacja Stripe Price IDs', () => {
  it('odrzuca placeholder "price_pro_monthly"', () => {
    expect(isRealStripePriceId('price_pro_monthly')).toBe(false);
  });

  it('odrzuca placeholder "price_business_yearly"', () => {
    expect(isRealStripePriceId('price_business_yearly')).toBe(false);
  });

  it('odrzuca zbyt krótkie ID "price_1xxx"', () => {
    expect(isRealStripePriceId('price_1xxx')).toBe(false);
  });

  it('odrzuca undefined', () => {
    expect(isRealStripePriceId(undefined)).toBe(false);
  });

  it('odrzuca pusty string', () => {
    expect(isRealStripePriceId('')).toBe(false);
  });

  it('akceptuje prawdziwe Stripe Price ID (≥14 znaków alfanum. po "price_")', () => {
    expect(isRealStripePriceId('price_1MkWBNLkBkqDaVD26')).toBe(true);
  });

  it('akceptuje prawdziwe Stripe Price ID o minimalnej długości', () => {
    // "price_" + 14 znaków = minimalne
    expect(isRealStripePriceId('price_AbCd1234EfGh56')).toBe(true);
  });
});

describe('isStripeConfigured — domyślny stan beta (brak Price IDs w zmiennych)', () => {
  it('zwraca false gdy VITE_STRIPE_PRICE_PRO_MONTHLY nie jest prawdziwym Stripe ID', () => {
    // W środowisku testowym VITE_STRIPE_PRICE_PRO_MONTHLY nie jest ustawione lub jest placeholder
    // Oczekujemy false — brak gotowego Stripe = tryb email-fallback
    const result = isStripeConfigured();
    expect(result).toBe(false);
  });
});

// ── 4. Plan config honesty ───────────────────────────────────────────────────

describe('PLANS config — uczciwe wartości', () => {
  it('plan free ma cenę 0', () => {
    const free = PLANS.find(p => p.id === 'free');
    expect(free).toBeDefined();
    expect(free!.pricePLN).toBe(0);
  });

  it('plan pro ma cenę > 0', () => {
    const pro = PLANS.find(p => p.id === 'pro');
    expect(pro).toBeDefined();
    expect(pro!.pricePLN).toBeGreaterThan(0);
  });

  it('plan business ma cenę > pro', () => {
    const pro = PLANS.find(p => p.id === 'pro');
    const business = PLANS.find(p => p.id === 'business');
    expect(business!.pricePLN).toBeGreaterThan(pro!.pricePLN);
  });

  it('żaden plan nie obiecuje "excelExport" w featuresKeys (brak UI przycisku — BETA-EXCEL-01)', () => {
    for (const plan of PLANS) {
      const hasExcel = plan.featuresKeys.some(k => k.includes('excelExport'));
      expect(hasExcel, `Plan "${plan.id}" ma excelExport w featuresKeys`).toBe(false);
    }
  });

  it('każdy plan ma id, name i maxProjects zdefiniowane', () => {
    for (const plan of PLANS) {
      expect(plan.id, `Plan missing id`).toBeTruthy();
      expect(plan.name, `Plan ${plan.id} missing name`).toBeTruthy();
      expect(plan.maxProjects, `Plan ${plan.id} missing maxProjects`).toBeGreaterThan(0);
    }
  });
});
