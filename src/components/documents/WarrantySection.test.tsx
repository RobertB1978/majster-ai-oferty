/**
 * WarrantySection.test.tsx — PR-18
 *
 * Tests: daysUntilExpiry helper + WarrantySection component rendering.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { daysUntilExpiry, calcEndDate } from '@/hooks/useWarranty';

// ── Mock Supabase ─────────────────────────────────────────────────────────────

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
  },
}));

// ── Mock i18n ─────────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts?.days !== undefined) return `Wygasa za ${opts.days} dni`;
      const map: Record<string, string> = {
        'warranty.noWarranty': 'Brak karty gwarancyjnej',
        'warranty.noWarrantyDesc': 'Dodaj gwarancję…',
        'warranty.addWarranty': 'Dodaj gwarancję',
        'warranty.expired': 'Gwarancja wygasła',
        'warranty.active': 'Aktywna',
        'warranty.downloadPdf': 'Pobierz kartę PDF',
        'warranty.saveToDossier': 'Zapisz do teczki',
        'warranty.sendEmail': 'Wyślij do klienta',
        'warranty.editWarranty': 'Edytuj gwarancję',
        'warranty.fields.warrantyMonths': 'Okres gwarancji (miesiące)',
        'warranty.pdf.endDate': 'Data ważności',
        'warranty.pdf.title': 'Karta Gwarancyjna',
      };
      return map[key] ?? key;
    },
    i18n: { language: 'pl' },
  }),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

// ── Tests: daysUntilExpiry ────────────────────────────────────────────────────

describe('daysUntilExpiry', () => {
  it('returns positive days for future date', () => {
    const future = new Date();
    future.setDate(future.getDate() + 30);
    const days = daysUntilExpiry(future.toISOString().slice(0, 10));
    expect(days).toBeGreaterThanOrEqual(29);
    expect(days).toBeLessThanOrEqual(31);
  });

  it('returns negative days for past date', () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    const days = daysUntilExpiry(past.toISOString().slice(0, 10));
    expect(days).toBeLessThan(0);
  });

  it('returns ~0 for today', () => {
    const today = new Date().toISOString().slice(0, 10);
    const days = daysUntilExpiry(today);
    expect(days).toBeGreaterThanOrEqual(0);
    expect(days).toBeLessThanOrEqual(1);
  });
});

// ── Tests: calcEndDate ────────────────────────────────────────────────────────

describe('calcEndDate', () => {
  it('adds months correctly', () => {
    const end = calcEndDate('2026-01-01', 24);
    expect(end.getFullYear()).toBe(2028);
    expect(end.getMonth()).toBe(0); // January
  });

  it('handles year boundary', () => {
    const end = calcEndDate('2025-11-01', 3);
    expect(end.getFullYear()).toBe(2026);
    expect(end.getMonth()).toBe(1); // February
  });
});

// ── Tests: WarrantySection empty state ────────────────────────────────────────

import { WarrantySection } from './WarrantySection';

describe('WarrantySection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Zapisz do teczki" button when warranty exists', async () => {
    const mockWarranty = {
      id: 'w-1',
      user_id: 'user-1',
      project_id: 'proj-1',
      client_name: 'Jan Kowalski',
      client_email: 'jan@example.com',
      contact_phone: '123456789',
      warranty_months: 24,
      start_date: '2026-01-01',
      end_date: '2028-01-01',
      scope_of_work: 'Remont łazienki',
      exclusions: null,
      pdf_storage_path: null,
      reminder_30_sent_at: null,
      reminder_7_sent_at: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    const { supabase } = await import('@/integrations/supabase/client');
    (supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      if (table === 'project_warranties_with_end') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: mockWarranty, error: null }),
            })),
          })),
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      };
    });

    render(
      <WarrantySection projectId="proj-1" projectTitle="Remont kuchni" />,
      { wrapper }
    );

    await screen.findByText('Zapisz do teczki');
    expect(screen.getByText('Pobierz kartę PDF')).toBeTruthy();
    expect(screen.getByText('Wyślij do klienta')).toBeTruthy();
  });

  it('renders empty state when no warranty', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const fromMock = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
    }));
    (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(fromMock);

    render(
      <WarrantySection projectId="proj-1" projectTitle="Remont kuchni" />,
      { wrapper }
    );

    // Loading first — then empty state appears
    await screen.findByText('Brak karty gwarancyjnej');
    expect(screen.getByText('Dodaj gwarancję')).toBeTruthy();
  });
});
