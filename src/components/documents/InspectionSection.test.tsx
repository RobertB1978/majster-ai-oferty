/**
 * InspectionSection.test.tsx — PR-18
 *
 * Tests: calcNextDueDate helper + InspectionSection rendering (empty state, status badges).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { calcNextDueDate } from '@/hooks/useInspection';

// ── Mock Supabase ─────────────────────────────────────────────────────────────

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
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
    t: (key: string) => {
      const map: Record<string, string> = {
        'inspection.noInspections': 'Brak zarejestrowanych przeglądów',
        'inspection.noInspectionsDesc': 'Dodaj przegląd, aby śledzić terminy.',
        'inspection.addInspection': 'Dodaj przegląd',
        'inspection.sections.overdue': 'Przeterminowane',
        'inspection.sections.planned': 'Zaplanowane',
        'inspection.sections.done': 'Wykonane',
        'reminders.noReminders': 'Brak przypomnień',
        'reminders.notificationDenied': 'Powiadomienia zablokowane',
        'reminders.inAppRemindersFallback': 'Przypomnienia są widoczne w aplikacji',
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

// ── Tests: calcNextDueDate ────────────────────────────────────────────────────

describe('calcNextDueDate', () => {
  it('adds 1 year for ANNUAL_BUILDING', () => {
    const result = calcNextDueDate('ANNUAL_BUILDING');
    const expected = new Date();
    expected.setFullYear(expected.getFullYear() + 1);
    const diffDays = Math.abs(
      (new Date(result).getTime() - expected.getTime()) / (1000 * 60 * 60 * 24),
    );
    expect(diffDays).toBeLessThanOrEqual(1);
  });

  it('adds 5 years for FIVE_YEAR_BUILDING', () => {
    const result = calcNextDueDate('FIVE_YEAR_BUILDING');
    const expected = new Date();
    expected.setFullYear(expected.getFullYear() + 5);
    const diffDays = Math.abs(
      (new Date(result).getTime() - expected.getTime()) / (1000 * 60 * 60 * 24),
    );
    expect(diffDays).toBeLessThanOrEqual(1);
  });

  it('adds 6 months for LARGE_AREA_SEMIANNUAL', () => {
    const result = calcNextDueDate('LARGE_AREA_SEMIANNUAL');
    const expected = new Date();
    expected.setMonth(expected.getMonth() + 6);
    const diffDays = Math.abs(
      (new Date(result).getTime() - expected.getTime()) / (1000 * 60 * 60 * 24),
    );
    expect(diffDays).toBeLessThanOrEqual(2);
  });
});

// ── Tests: InspectionSection ──────────────────────────────────────────────────

import { InspectionSection } from './InspectionSection';

describe('InspectionSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no inspections', async () => {
    render(
      <InspectionSection projectId="proj-1" projectTitle="Budynek A" />,
      { wrapper },
    );

    await screen.findByText('Brak zarejestrowanych przeglądów');
    expect(screen.getByText('Dodaj przegląd')).toBeTruthy();
  });
});
