/**
 * ProjectHub — testy relacji Oferta → Projekt
 *
 * Weryfikuje, że:
 * 1. Baner "Powstał z oferty" pojawia się gdy projekt ma source_offer_id.
 * 2. Baner nie pojawia się gdy source_offer_id jest null (projekt ręczny).
 * 3. Baner renderuje tytuł oferty i link do niej.
 * 4. Gdy tytuł oferty jest pusty, wyświetlany jest fallback.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import * as useProjectsV2Hook from '@/hooks/useProjectsV2';
import * as useOffersHook from '@/hooks/useOffers';
import ProjectHub from '@/pages/ProjectHub';

// ── Mocki infrastruktury ───────────────────────────────────────────────────────

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@example.com' },
    loading: false,
  }),
}));

// Mocki hooków projektu
vi.mock('@/hooks/useProjectsV2');
vi.mock('@/hooks/useOffers');

// Mock Slider — Radix UI ResizeObserver nie działa jako konstruktor w Vitest 4
vi.mock('@/components/ui/slider', () => ({
  Slider: (props: Record<string, unknown>) => (
    <input type="range" data-testid="slider" {...(props as object)} />
  ),
}));

// Mocki komponentów sekcji — izolujemy ProjectHub od zależności sekcji
vi.mock('@/components/costs/BurnBarSection', () => ({
  BurnBarSection: () => <div data-testid="burn-bar" />,
}));
vi.mock('@/components/photos/PhotoReportPanel', () => ({
  PhotoReportPanel: () => <div data-testid="photo-report" />,
}));
vi.mock('@/components/photos/AcceptanceChecklistPanel', () => ({
  AcceptanceChecklistPanel: () => <div data-testid="checklist" />,
}));
vi.mock('@/components/documents/DossierPanel', () => ({
  DossierPanel: () => <div data-testid="dossier" />,
}));
vi.mock('@/components/documents/WarrantySection', () => ({
  WarrantySection: () => <div data-testid="warranty" />,
}));
vi.mock('@/components/documents/InspectionSection', () => ({
  InspectionSection: () => <div data-testid="inspection-section" />,
}));

// ── Fabryki danych testowych ───────────────────────────────────────────────────

function makeProject(overrides: Partial<ReturnType<typeof baseProject>> = {}) {
  return { ...baseProject(), ...overrides };
}

function baseProject() {
  return {
    id: 'proj-1',
    user_id: 'user-1',
    client_id: null,
    source_offer_id: null,
    title: 'Remont łazienki',
    status: 'ACTIVE' as const,
    start_date: null,
    end_date: null,
    progress_percent: 0,
    stages_json: [],
    total_from_offer: null,
    budget_net: null,
    budget_source: null,
    budget_updated_at: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };
}

function makeSourceOfferData(overrides = {}) {
  return {
    id: 'offer-abc',
    title: 'Oferta – remont łazienki 01/2025',
    total_net: 12000,
    currency: 'PLN',
    accepted_at: '2025-02-15T10:00:00Z',
    ...overrides,
  };
}

// ── Pomocniki mockowania ───────────────────────────────────────────────────────

function mockProjectHook(project: ReturnType<typeof makeProject> | null, opts = {}) {
  vi.spyOn(useProjectsV2Hook, 'useProjectV2').mockReturnValue({
    data: project,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...opts,
  } as never);

  vi.spyOn(useProjectsV2Hook, 'useUpdateProjectV2').mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  } as never);

  vi.spyOn(useProjectsV2Hook, 'useProjectPublicToken').mockReturnValue({
    data: null,
    isLoading: false,
  } as never);

  vi.spyOn(useProjectsV2Hook, 'useCreateProjectPublicToken').mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  } as never);
}

// ── Testy ─────────────────────────────────────────────────────────────────────

describe('ProjectHub — relacja Oferta → Projekt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('wyświetla baner źródłowej oferty gdy source_offer_id jest ustawiony', async () => {
    const project = makeProject({ source_offer_id: 'offer-abc' });
    mockProjectHook(project);

    vi.spyOn(useOffersHook, 'useSourceOffer').mockReturnValue({
      data: makeSourceOfferData(),
      isLoading: false,
    } as never);

    render(<ProjectHub />);

    expect(screen.getByText(/Powstał z oferty/i)).toBeDefined();
    expect(screen.getByText(/Oferta – remont łazienki 01\/2025/i)).toBeDefined();
  });

  it('wyświetla link do oferty klikalny z tytułem oferty', async () => {
    const project = makeProject({ source_offer_id: 'offer-abc' });
    mockProjectHook(project);

    vi.spyOn(useOffersHook, 'useSourceOffer').mockReturnValue({
      data: makeSourceOfferData(),
      isLoading: false,
    } as never);

    render(<ProjectHub />);

    const link = screen.getByRole('button', { name: /Oferta – remont łazienki 01\/2025/i });
    expect(link).toBeDefined();
  });

  it('wyświetla fallback tytułu gdy oferta nie ma tytułu', async () => {
    const project = makeProject({ source_offer_id: 'offer-abc' });
    mockProjectHook(project);

    vi.spyOn(useOffersHook, 'useSourceOffer').mockReturnValue({
      data: makeSourceOfferData({ title: null }),
      isLoading: false,
    } as never);

    render(<ProjectHub />);

    expect(screen.getByText(/Oferta bez tytułu/i)).toBeDefined();
  });

  it('NIE wyświetla banera gdy source_offer_id jest null (projekt ręczny)', () => {
    const project = makeProject({ source_offer_id: null });
    mockProjectHook(project);

    // useSourceOffer nie powinien być wołany, ale mockujemy dla bezpieczeństwa
    vi.spyOn(useOffersHook, 'useSourceOffer').mockReturnValue({
      data: null,
      isLoading: false,
    } as never);

    render(<ProjectHub />);

    expect(screen.queryByText(/Powstał z oferty/i)).toBeNull();
  });

  it('NIE wyświetla banera gdy oferta jest niedostępna (usunięta/brak dostępu)', () => {
    const project = makeProject({ source_offer_id: 'offer-deleted' });
    mockProjectHook(project);

    vi.spyOn(useOffersHook, 'useSourceOffer').mockReturnValue({
      data: null,
      isLoading: false,
    } as never);

    render(<ProjectHub />);

    expect(screen.queryByText(/Powstał z oferty/i)).toBeNull();
  });

  it('NIE wyświetla banera podczas ładowania danych oferty', () => {
    const project = makeProject({ source_offer_id: 'offer-abc' });
    mockProjectHook(project);

    vi.spyOn(useOffersHook, 'useSourceOffer').mockReturnValue({
      data: undefined,
      isLoading: true,
    } as never);

    render(<ProjectHub />);

    expect(screen.queryByText(/Powstał z oferty/i)).toBeNull();
  });
});

// ── Testy: Sekcja Przeglądy techniczne w accordion ────────────────────────────

describe('ProjectHub — sekcja Przeglądy techniczne', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('wyświetla nagłówek sekcji "Przeglądy techniczne" w accordion', () => {
    const project = makeProject();
    mockProjectHook(project);

    vi.spyOn(useOffersHook, 'useSourceOffer').mockReturnValue({
      data: null,
      isLoading: false,
    } as never);

    render(<ProjectHub />);

    expect(screen.getByText('Przeglądy techniczne')).toBeDefined();
  });

  it('renderuje InspectionSection po rozwinięciu accordion', () => {
    const project = makeProject();
    mockProjectHook(project);

    vi.spyOn(useOffersHook, 'useSourceOffer').mockReturnValue({
      data: null,
      isLoading: false,
    } as never);

    render(<ProjectHub />);

    // Kliknij nagłówek sekcji "Przeglądy techniczne"
    const header = screen.getByText('Przeglądy techniczne');
    fireEvent.click(header);

    expect(screen.getByTestId('inspection-section')).toBeDefined();
  });
});
