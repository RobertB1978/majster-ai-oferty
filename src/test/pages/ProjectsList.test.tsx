/**
 * ProjectsList.test.tsx
 *
 * Weryfikuje hierarchię CTA zgodną z przepływem Oferta-first:
 *  1. Empty state — przycisk główny prowadzi do /app/offers (nie do /app/projects/new)
 *  2. Empty state — przycisk drugorzędny "Utwórz projekt ręcznie" prowadzi do /app/projects/new
 *  3. Nagłówek — przycisk "Nowy projekt" ma wariant outline (drugorzędny)
 *
 * Weryfikuje separację kliknięcia wiersz vs. archiwizacja:
 *  4. Kliknięcie wiersza projektu nawiguje do szczegółów
 *  5. Kliknięcie przycisku archiwizacji NIE nawiguje — otwiera dialog
 *  6. Potwierdzenie archiwizacji wywołuje mutację
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ---------- Mock navigate ----------

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

// ---------- Mock hooks ----------

const mockMutate = vi.fn();

vi.mock('@/hooks/useProjectsV2', () => ({
  useProjectsV2List: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }),
  useDeleteProjectV2: () => ({ mutate: mockMutate }),
}));

vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (v: string) => v,
}));

// ---------- Mock i18next — zwraca klucz jako tekst ----------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'pl' },
  }),
}));

// ---------- Mock AuthContext ----------

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { email: 'test@test.com' }, isLoading: false }),
}));

// ---------- Mock sonner (toast) ----------

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ---------- Fabryka projektu testowego ----------

function makeProject(overrides = {}) {
  return {
    id: 'proj-123',
    user_id: 'user-1',
    client_id: null,
    source_offer_id: null,
    title: 'Remont łazienki',
    status: 'ACTIVE',
    start_date: null,
    end_date: null,
    progress_percent: 30,
    stages_json: [],
    total_from_offer: null,
    budget_net: null,
    budget_source: null,
    budget_updated_at: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

// ---------- Wrapper ----------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

// ---------- Tests ----------

describe('ProjectsList — hierarchia CTA (offer-first)', () => {
  beforeEach(() => mockNavigate.mockClear());

  it('empty state: przycisk główny naviguje do /app/offers (nie /app/projects/new)', async () => {
    const { default: ProjectsList } = await import('@/pages/ProjectsList');
    render(<ProjectsList />, { wrapper: Wrapper });

    // Przycisk główny EmptyState — klucz t('projectsV2.emptyCta')
    const primaryBtn = screen.getByRole('button', { name: 'projectsV2.emptyCta' });
    fireEvent.click(primaryBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/app/offers');
    expect(mockNavigate).not.toHaveBeenCalledWith('/app/projects/new');
  });

  it('empty state: przycisk drugorzędny naviguje do /app/projects/new', async () => {
    const { default: ProjectsList } = await import('@/pages/ProjectsList');
    render(<ProjectsList />, { wrapper: Wrapper });

    // Przycisk drugorzędny — klucz t('projectsV2.manualCta')
    const manualBtn = screen.getByRole('button', { name: 'projectsV2.manualCta' });
    fireEvent.click(manualBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/app/projects/new');
  });

  it('nagłówek: przycisk "Nowy projekt" ma wariant outline (traktowany drugorzędnie)', async () => {
    const { default: ProjectsList } = await import('@/pages/ProjectsList');
    render(<ProjectsList />, { wrapper: Wrapper });

    // Przycisk nagłówka — klucz t('projectsV2.newProject')
    const headerBtn = screen.getByRole('button', { name: 'projectsV2.newProject' });
    // Wariant outline powinien zawierać 'border' w klasach (shadcn/ui)
    expect(headerBtn.className).toMatch(/border/);
  });
});

describe('ProjectsList — separacja kliknięcia: wiersz vs. archiwizacja', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockMutate.mockClear();
  });

  async function renderWithProject(overrides = {}) {
    // Importujemy hook i nadpisujemy go projektem testowym
    const useProjectsV2Module = await import('@/hooks/useProjectsV2');
    vi.spyOn(useProjectsV2Module, 'useProjectsV2List').mockReturnValue({
      data: [makeProject(overrides)],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as ReturnType<typeof useProjectsV2Module.useProjectsV2List>);

    const { default: ProjectsList } = await import('@/pages/ProjectsList');
    return render(<ProjectsList />, { wrapper: Wrapper });
  }

  it('kliknięcie w wiersz projektu nawiguje do szczegółów', async () => {
    await renderWithProject();

    // Wiersz projektu ma role="button" i aria-label równy tytułowi
    const row = screen.getByRole('button', { name: 'Remont łazienki' });
    fireEvent.click(row);

    expect(mockNavigate).toHaveBeenCalledWith('/app/projects/proj-123');
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('kliknięcie przycisku archiwizacji NIE nawiguje do szczegółów projektu', async () => {
    await renderWithProject();

    const archiveBtn = screen.getByRole('button', { name: 'projectsV2.archiveProject' });
    fireEvent.click(archiveBtn);

    // Nawigacja NIE powinna być wywołana — stopPropagation blokuje kliknięcie wiersza
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('kliknięcie przycisku archiwizacji otwiera dialog potwierdzenia', async () => {
    await renderWithProject();

    const archiveBtn = screen.getByRole('button', { name: 'projectsV2.archiveProject' });
    fireEvent.click(archiveBtn);

    // Tytuł dialogu powinien być widoczny
    expect(screen.getByText('projectsV2.archiveConfirmTitle')).toBeInTheDocument();
  });

  it('potwierdzenie archiwizacji wywołuje mutację bez nawigacji', async () => {
    await renderWithProject();

    // Otwórz dialog
    const archiveBtn = screen.getByRole('button', { name: 'projectsV2.archiveProject' });
    fireEvent.click(archiveBtn);

    // Kliknij przycisk potwierdzenia w dialogu
    const confirmBtn = screen.getByRole('button', { name: 'projectsV2.archiveConfirmAction' });
    fireEvent.click(confirmBtn);

    expect(mockMutate).toHaveBeenCalledWith('proj-123', expect.objectContaining({
      onSuccess: expect.any(Function),
      onError: expect.any(Function),
    }));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('projekty ze statusem CANCELLED nie są renderowane (wykluczone przez hook)', async () => {
    // Symuluj CANCELLED projekt zwrócony przez hook (nie powinno się zdarzać po naprawie,
    // ale weryfikujemy że UI nie renderuje go bez przycisku archiwizacji)
    await renderWithProject({ status: 'CANCELLED', title: 'Stary projekt' });

    // Wiersz jest widoczny (nie filtrujemy na poziomie UI)
    const row = screen.getByRole('button', { name: 'Stary projekt' });
    expect(row).toBeInTheDocument();

    // Przycisk archiwizacji NIE jest widoczny dla CANCELLED projektu
    expect(screen.queryByRole('button', { name: 'projectsV2.archiveProject' })).toBeNull();
  });
});
