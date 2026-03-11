/**
 * ProjectsList.test.tsx
 *
 * Weryfikuje hierarchię CTA zgodną z przepływem Oferta-first:
 *  1. Empty state — przycisk główny prowadzi do /app/offers (nie do /app/projects/new)
 *  2. Empty state — przycisk drugorzędny "Utwórz projekt ręcznie" prowadzi do /app/projects/new
 *  3. Nagłówek — przycisk "Nowy projekt" ma wariant outline (drugorzędny)
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

vi.mock('@/hooks/useProjectsV2', () => ({
  useProjectsV2List: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }),
  useDeleteProjectV2: () => ({ mutate: vi.fn() }),
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
