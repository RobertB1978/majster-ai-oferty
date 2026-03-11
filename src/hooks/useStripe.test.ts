// ============================================================================
// Tests for useStripe.ts — pure helper functions
//
// Testujemy isRealStripePriceId i isStripeConfigured, które są czystymi
// funkcjami niezależnymi od środowiska Deno / przeglądarki.
// ============================================================================

import { describe, it, expect, vi, afterEach } from 'vitest';
import { isRealStripePriceId, isStripeConfigured } from './useStripe';

afterEach(() => {
  vi.unstubAllEnvs();
});

// ---------------------------------------------------------------------------
// isRealStripePriceId
// ---------------------------------------------------------------------------

describe('isRealStripePriceId', () => {
  // Prawdziwe Stripe Price IDs — format: price_ + min. 14 znaków alfanumerycznych
  it('akceptuje prawdziwe live Stripe Price ID', () => {
    expect(isRealStripePriceId('price_1MkWBNLkBkqDaVD26L6D3Dz')).toBe(true);
  });

  it('akceptuje prawdziwe test Stripe Price ID', () => {
    expect(isRealStripePriceId('price_1ABC123DEFghij4567')).toBe(true);
  });

  it('akceptuje ID z dokładnie 14 znakami po prefiksie', () => {
    expect(isRealStripePriceId('price_12345678901234')).toBe(true);
  });

  it('akceptuje ID z 20 znakami po prefiksie', () => {
    expect(isRealStripePriceId('price_12345678901234567890')).toBe(true);
  });

  // Placeholder Price IDs — MUSZĄ być odrzucone
  it('odrzuca placeholder: price_pro_monthly', () => {
    expect(isRealStripePriceId('price_pro_monthly')).toBe(false);
  });

  it('odrzuca placeholder: price_starter_monthly', () => {
    expect(isRealStripePriceId('price_starter_monthly')).toBe(false);
  });

  it('odrzuca placeholder: price_business_monthly', () => {
    expect(isRealStripePriceId('price_business_monthly')).toBe(false);
  });

  it('odrzuca placeholder: price_enterprise_monthly', () => {
    expect(isRealStripePriceId('price_enterprise_monthly')).toBe(false);
  });

  it('odrzuca placeholder: price_pro_yearly', () => {
    expect(isRealStripePriceId('price_pro_yearly')).toBe(false);
  });

  it('odrzuca placeholder: price_business_yearly', () => {
    expect(isRealStripePriceId('price_business_yearly')).toBe(false);
  });

  // Edge cases
  it('odrzuca undefined', () => {
    expect(isRealStripePriceId(undefined)).toBe(false);
  });

  it('odrzuca pusty string', () => {
    expect(isRealStripePriceId('')).toBe(false);
  });

  it('odrzuca ID za krótkie (13 znaków po prefiksie)', () => {
    expect(isRealStripePriceId('price_1234567890123')).toBe(false);
  });

  it('odrzuca ID z myślnikami po prefiksie', () => {
    expect(isRealStripePriceId('price_abc-def-ghi-jkl-mno')).toBe(false);
  });

  it('odrzuca ID bez prefiksu price_', () => {
    expect(isRealStripePriceId('prod_1MkWBNLkBkqDaVD26L6D3Dz')).toBe(false);
  });

  // SECURITY: Wszystkie domyślne placeholdery muszą być odrzucone
  it('SECURITY: każdy z domyślnych placeholderów jest odrzucony', () => {
    const placeholders = [
      'price_pro_monthly',
      'price_pro_yearly',
      'price_starter_monthly',
      'price_starter_yearly',
      'price_business_monthly',
      'price_business_yearly',
      'price_enterprise_monthly',
      'price_enterprise_yearly',
    ];
    placeholders.forEach((p) => {
      expect(isRealStripePriceId(p), `Placeholder "${p}" musi być odrzucony`).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// isStripeConfigured
// ---------------------------------------------------------------------------

describe('isStripeConfigured', () => {
  it('zwraca false gdy VITE_STRIPE_ENABLED nie jest ustawiony', () => {
    vi.stubEnv('VITE_STRIPE_ENABLED', '');
    vi.stubEnv('VITE_STRIPE_PRICE_PRO_MONTHLY', 'price_1MkWBNLkBkqDaVD26L6D3Dz');
    expect(isStripeConfigured()).toBe(false);
  });

  it('zwraca false gdy VITE_STRIPE_ENABLED=false', () => {
    vi.stubEnv('VITE_STRIPE_ENABLED', 'false');
    vi.stubEnv('VITE_STRIPE_PRICE_PRO_MONTHLY', 'price_1MkWBNLkBkqDaVD26L6D3Dz');
    expect(isStripeConfigured()).toBe(false);
  });

  it('zwraca false gdy VITE_STRIPE_ENABLED=true ale brak Price ID', () => {
    vi.stubEnv('VITE_STRIPE_ENABLED', 'true');
    vi.stubEnv('VITE_STRIPE_PRICE_PRO_MONTHLY', '');
    expect(isStripeConfigured()).toBe(false);
  });

  it('zwraca false gdy VITE_STRIPE_ENABLED=true ale Price ID to placeholder', () => {
    vi.stubEnv('VITE_STRIPE_ENABLED', 'true');
    vi.stubEnv('VITE_STRIPE_PRICE_PRO_MONTHLY', 'price_pro_monthly');
    expect(isStripeConfigured()).toBe(false);
  });

  it('zwraca true gdy VITE_STRIPE_ENABLED=true i Price ID wygląda jak prawdziwy', () => {
    vi.stubEnv('VITE_STRIPE_ENABLED', 'true');
    vi.stubEnv('VITE_STRIPE_PRICE_PRO_MONTHLY', 'price_1MkWBNLkBkqDaVD26L6D3Dz');
    expect(isStripeConfigured()).toBe(true);
  });

  it('SECURITY: placeholder price ID nigdy nie pozwala na konfigurację', () => {
    const badIds = [
      'price_pro_monthly',
      'price_business_yearly',
      'price_starter_monthly',
    ];
    vi.stubEnv('VITE_STRIPE_ENABLED', 'true');
    badIds.forEach((badId) => {
      vi.stubEnv('VITE_STRIPE_PRICE_PRO_MONTHLY', badId);
      expect(isStripeConfigured(), `Placeholder "${badId}" nie powinien aktywować Stripe`).toBe(false);
    });
  });
});
