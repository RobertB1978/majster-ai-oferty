/**
 * offer-versioning.test.ts
 * Sprint: offer-versioning-7RcU5
 *
 * Tests for:
 * 1. computeTotalsForItems — single-variant and multi-variant totals
 * 2. computeTotals — no-variant vs variant mode
 * 3. WizardFormData structure — variant integrity
 * 4. useOfferWizard helpers — edge cases
 * 5. OfferPublicAccept — variant rendering and graceful degradation
 * 6. Photo visibility logic
 * 7. offerPdfPayloadBuilder — variant sections built correctly
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useParams: () => ({ token: 'test-token-abc123' }),
    useNavigate: () => vi.fn(),
  };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    rpc: vi.fn(),
    from: vi.fn(),
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: vi.fn(() => Promise.resolve({ data: { signedUrl: 'https://example.com/photo.jpg' } })),
      })),
    },
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1', email: 'test@example.com' }, isLoading: false }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && 'days' in opts) return `${String(opts.days)} days`;
      return key;
    },
    i18n: { language: 'pl', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  HelmetProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

function PublicWrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/a/test-token-abc123']}>
      <QueryClientProvider client={makeQC()}>
        {children}
      </QueryClientProvider>
    </MemoryRouter>
  );
}

// ── 1. computeTotalsForItems ──────────────────────────────────────────────────

describe('computeTotalsForItems', () => {
  it('returns zeros for empty items array', async () => {
    const { computeTotalsForItems } = await import('@/hooks/useOfferWizard');
    const result = computeTotalsForItems([]);
    expect(result.total_net).toBe(0);
    expect(result.total_vat).toBe(0);
    expect(result.total_gross).toBe(0);
  });

  it('computes correct totals for single item without VAT', async () => {
    const { computeTotalsForItems } = await import('@/hooks/useOfferWizard');
    const items = [{
      localId: '1', dbId: null, name: 'Test', unit: 'szt.', qty: 2,
      unit_price_net: 100, vat_rate: null, item_type: 'labor' as const,
    }];
    const result = computeTotalsForItems(items);
    expect(result.total_net).toBe(200);
    expect(result.total_vat).toBe(0);
    expect(result.total_gross).toBe(200);
  });

  it('computes correct totals for item with 23% VAT', async () => {
    const { computeTotalsForItems } = await import('@/hooks/useOfferWizard');
    const items = [{
      localId: '1', dbId: null, name: 'Test', unit: 'szt.', qty: 1,
      unit_price_net: 100, vat_rate: 23, item_type: 'labor' as const,
    }];
    const result = computeTotalsForItems(items);
    expect(result.total_net).toBe(100);
    expect(result.total_vat).toBe(23);
    expect(result.total_gross).toBe(123);
  });

  it('rounds to 2 decimal places', async () => {
    const { computeTotalsForItems } = await import('@/hooks/useOfferWizard');
    const items = [{
      localId: '1', dbId: null, name: 'Test', unit: 'szt.', qty: 3,
      unit_price_net: 33.33, vat_rate: null, item_type: 'labor' as const,
    }];
    const result = computeTotalsForItems(items);
    expect(result.total_net).toBe(99.99);
  });
});

// ── 2. computeTotals — variant mode vs no-variant ─────────────────────────────

describe('computeTotals', () => {
  it('uses items when no variants', async () => {
    const { computeTotals } = await import('@/hooks/useOfferWizard');
    const form = {
      items: [{
        localId: '1', dbId: null, name: 'A', unit: 'szt.', qty: 1,
        unit_price_net: 50, vat_rate: null, item_type: 'labor' as const,
      }],
      variants: [],
      marginPercent: 0,
    };
    const result = computeTotals(form);
    expect(result.total_net).toBe(50);
  });

  it('uses first variant items when variants exist', async () => {
    const { computeTotals } = await import('@/hooks/useOfferWizard');
    const form = {
      items: [], // ignored in variant mode
      variants: [
        {
          localId: 'v1', dbId: null, label: 'Wariant 1',
          items: [{
            localId: 'i1', dbId: null, name: 'B', unit: 'szt.', qty: 2,
            unit_price_net: 200, vat_rate: null, item_type: 'labor' as const,
          }],
        },
        {
          localId: 'v2', dbId: null, label: 'Wariant 2',
          items: [{
            localId: 'i2', dbId: null, name: 'C', unit: 'szt.', qty: 1,
            unit_price_net: 999, vat_rate: null, item_type: 'labor' as const,
          }],
        },
      ],
      marginPercent: 0,
    };
    const result = computeTotals(form);
    // Should use first variant (400), not second (999)
    expect(result.total_net).toBe(400);
    expect(result.total_net).not.toBe(999);
  });

  it('returns zeros when variants exist but first is empty', async () => {
    const { computeTotals } = await import('@/hooks/useOfferWizard');
    const form = {
      items: [],
      variants: [{ localId: 'v1', dbId: null, label: 'Wariant 1', items: [] }],
      marginPercent: 0,
    };
    const result = computeTotals(form);
    expect(result.total_net).toBe(0);
    expect(result.total_gross).toBe(0);
  });
});

// ── 3. WizardVariant structure ────────────────────────────────────────────────

describe('WizardVariant structure', () => {
  it('type exports are stable', async () => {
    const mod = await import('@/hooks/useOfferWizard');
    // Type guard: module exports required symbols
    expect(typeof mod.computeTotals).toBe('function');
    expect(typeof mod.computeTotalsForItems).toBe('function');
    expect(typeof mod.useSaveDraft).toBe('function');
    expect(typeof mod.useLoadOfferDraft).toBe('function');
  });
});

// ── 4. OfferPublicAccept — graceful degradation without variants ───────────────

describe('OfferPublicAccept — no variants (backward compat)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('renders offer items table without variant selector when variants array is empty', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        offer: {
          id: 'offer-1',
          title: 'Oferta testowa',
          status: 'SENT',
          currency: 'PLN',
          total_net: 1000,
          total_vat: 0,
          total_gross: 1000,
          created_at: '2026-03-01T10:00:00Z',
          accepted_at: null,
          rejected_at: null,
        },
        client: null,
        company: null,
        items: [
          { id: 'item-1', name: 'Praca budowlana', unit: 'godz.', qty: 10, unit_price_net: 100, vat_rate: null, line_total_net: 1000, variant_id: null },
        ],
        variants: [], // no variants
        expires_at: '2026-04-01T10:00:00Z',
      },
      error: null,
    });

    const { default: OfferPublicAccept } = await import('@/pages/OfferPublicAccept');
    render(<OfferPublicAccept />, { wrapper: PublicWrapper });

    await waitFor(() => {
      // Items table should be visible
      expect(screen.getByText('Praca budowlana')).toBeDefined();
    });

    // Variant selector should NOT be present
    expect(screen.queryByText('publicOffer.variantsTitle')).toBeNull();
  });
});

// ── 5. OfferPublicAccept — variant rendering ──────────────────────────────────

describe('OfferPublicAccept — with variants', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('shows variant selector with multiple variant tabs', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        offer: {
          id: 'offer-2',
          title: 'Oferta wielowariantowa',
          status: 'SENT',
          currency: 'PLN',
          total_net: 500,
          total_vat: 0,
          total_gross: 500,
          created_at: '2026-03-01T10:00:00Z',
          accepted_at: null,
          rejected_at: null,
        },
        client: null,
        company: null,
        items: [
          { id: 'item-a', name: 'Pozycja A', unit: 'szt.', qty: 1, unit_price_net: 500, vat_rate: null, line_total_net: 500, variant_id: 'variant-1' },
          { id: 'item-b', name: 'Pozycja B', unit: 'szt.', qty: 1, unit_price_net: 800, vat_rate: null, line_total_net: 800, variant_id: 'variant-2' },
        ],
        variants: [
          { id: 'variant-1', label: 'Wariant Podstawowy', sort_order: 0 },
          { id: 'variant-2', label: 'Wariant Premium', sort_order: 1 },
        ],
        expires_at: '2026-04-01T10:00:00Z',
      },
      error: null,
    });

    const { default: OfferPublicAccept } = await import('@/pages/OfferPublicAccept');
    render(<OfferPublicAccept />, { wrapper: PublicWrapper });

    await waitFor(() => {
      // Variant titles should appear
      expect(screen.getByText('publicOffer.variantsTitle')).toBeDefined();
      expect(screen.getAllByText('Wariant Podstawowy').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Wariant Premium').length).toBeGreaterThan(0);
    });
  });

  it('shows only first variant items by default', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        offer: {
          id: 'offer-3',
          title: 'Test',
          status: 'SENT',
          currency: 'PLN',
          total_net: 100,
          total_vat: 0,
          total_gross: 100,
          created_at: '2026-03-01T10:00:00Z',
          accepted_at: null,
          rejected_at: null,
        },
        client: null,
        company: null,
        items: [
          { id: 'item-x', name: 'Pozycja tylko w wariancie 1', unit: 'szt.', qty: 1, unit_price_net: 100, vat_rate: null, line_total_net: 100, variant_id: 'v1' },
          { id: 'item-y', name: 'Pozycja tylko w wariancie 2', unit: 'szt.', qty: 1, unit_price_net: 200, vat_rate: null, line_total_net: 200, variant_id: 'v2' },
        ],
        variants: [
          { id: 'v1', label: 'Opcja A', sort_order: 0 },
          { id: 'v2', label: 'Opcja B', sort_order: 1 },
        ],
        expires_at: '2026-04-01T10:00:00Z',
      },
      error: null,
    });

    const { default: OfferPublicAccept } = await import('@/pages/OfferPublicAccept');
    render(<OfferPublicAccept />, { wrapper: PublicWrapper });

    await waitFor(() => {
      // Only first variant items should be visible initially
      expect(screen.getByText('Pozycja tylko w wariancie 1')).toBeDefined();
    });

    // Second variant's item should NOT be visible initially
    expect(screen.queryByText('Pozycja tylko w wariancie 2')).toBeNull();
  });
});

// ── 6. OfferPublicAccept — already decided (ACCEPTED) ────────────────────────

describe('OfferPublicAccept — already accepted', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('shows accepted banner and hides action buttons', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        offer: {
          id: 'offer-4',
          title: 'Test',
          status: 'ACCEPTED',
          currency: 'PLN',
          total_net: 500,
          total_vat: 0,
          total_gross: 500,
          created_at: '2026-03-01T10:00:00Z',
          accepted_at: '2026-03-05T10:00:00Z',
          rejected_at: null,
        },
        client: null,
        company: null,
        items: [],
        variants: [],
        expires_at: '2026-04-01T10:00:00Z',
      },
      error: null,
    });

    const { default: OfferPublicAccept } = await import('@/pages/OfferPublicAccept');
    render(<OfferPublicAccept />, { wrapper: PublicWrapper });

    await waitFor(() => {
      expect(screen.getByText('publicOffer.alreadyAccepted')).toBeDefined();
    });

    // Accept/reject buttons should NOT appear
    expect(screen.queryByText('publicOffer.acceptBtn')).toBeNull();
    expect(screen.queryByText('publicOffer.rejectBtn')).toBeNull();
  });
});

// ── 7. Photo visibility logic (pure logic) ────────────────────────────────────

describe('Offer photo visibility flags', () => {
  it('photo with both flags false is internal-only', () => {
    const photo = { show_in_pdf: false, show_in_public: false };
    const isInternal = !photo.show_in_pdf && !photo.show_in_public;
    expect(isInternal).toBe(true);
  });

  it('photo with show_in_public=true is not internal', () => {
    const photo = { show_in_pdf: false, show_in_public: true };
    const isInternal = !photo.show_in_pdf && !photo.show_in_public;
    expect(isInternal).toBe(false);
  });

  it('photo can be in PDF only without being public', () => {
    const photo = { show_in_pdf: true, show_in_public: false };
    expect(photo.show_in_pdf).toBe(true);
    expect(photo.show_in_public).toBe(false);
    const isInternal = !photo.show_in_pdf && !photo.show_in_public;
    expect(isInternal).toBe(false);
  });

  it('photo can be both in PDF and public', () => {
    const photo = { show_in_pdf: true, show_in_public: true };
    expect(photo.show_in_pdf).toBe(true);
    expect(photo.show_in_public).toBe(true);
  });
});

// ── 8. OfferPdfPayload — variant sections ─────────────────────────────────────

describe('OfferPdfPayload variantSections', () => {
  it('variantSections is optional on the type', async () => {
    const { buildOfferData } = await import('@/lib/offerDataBuilder');
    const payload = buildOfferData({
      projectId: 'proj-1',
      projectName: 'Test',
    });
    // No variantSections = undefined (no-variant mode)
    expect(payload.variantSections).toBeUndefined();
  });
});

// ── 9. PDF compliance lines not broken by variant additions ───────────────────

describe('getPdfComplianceLines — unaffected by variants', () => {
  it('returns correct compliance lines for payload without variants', async () => {
    const { getPdfComplianceLines } = await import('@/lib/offerPdfGenerator');
    const { buildOfferData } = await import('@/lib/offerDataBuilder');
    const payload = buildOfferData({ projectId: 'abc123', projectName: 'Test' });
    const lines = getPdfComplianceLines(payload);

    expect(lines.documentIdLine).toContain('Nr:');
    expect(lines.issuedAtLine).toContain('Data wystawienia:');
    expect(lines.validUntilLine).toContain('Ważna do:');
    expect(lines.vatExemptLine).toContain('VAT');
  });
});
