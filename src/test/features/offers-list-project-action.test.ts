/**
 * Offers list — project action state consistency
 *
 * Weryfikuje że lista ofert pokazuje właściwy przycisk akcji:
 *  - zaakceptowana oferta BEZ projektu → "Utwórz projekt"
 *  - zaakceptowana oferta Z istniejącym projektem → "Otwórz projekt"
 *  - kliknięcie "Otwórz projekt" nawiguje bezpośrednio do projektu
 *  - kliknięcie "Utwórz projekt" dalej respektuje duplicate prevention
 *  - reguła biznesowa "wiele ofert, jeden projekt" nie jest naruszana
 *
 * Testy oparte na czystej logice decyzyjnej (bez renderowania komponentu).
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ── Stub typów ────────────────────────────────────────────────────────────────

interface ProjectStub {
  id: string;
  source_offer_id: string | null;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
}

// ── Czysta logika odpowiadająca findProjectBySourceOffer ──────────────────────

function findProjectBySourceOffer(
  projects: ProjectStub[],
  sourceOfferId: string,
): ProjectStub | null {
  const match = projects
    .filter(
      (p) => p.source_offer_id === sourceOfferId && p.status !== 'CANCELLED',
    )
    .sort((a, b) => b.id.localeCompare(a.id));
  return match[0] ?? null;
}

// ── Logika decyzyjna UI listy ofert ───────────────────────────────────────────

type ProjectActionLabel = 'openProject' | 'createProject' | 'loading';

/**
 * Mirrors the decision tree in OfferRow (Offers.tsx):
 *  loading      → wyświetl spinner
 *  existingProject → "Otwórz projekt"
 *  no project   → "Utwórz projekt"
 */
function resolveProjectActionLabel(
  isLoading: boolean,
  existingProject: ProjectStub | null,
): ProjectActionLabel {
  if (isLoading) return 'loading';
  if (existingProject) return 'openProject';
  return 'createProject';
}

// ── Symulacja handleCreateProject z ochroną przed duplikatami ────────────────

function simulateHandleCreateProject(
  projects: ProjectStub[],
  offerId: string,
): { action: 'redirect' | 'create'; targetId: string } {
  const existing = findProjectBySourceOffer(projects, offerId);
  if (existing) {
    return { action: 'redirect', targetId: existing.id };
  }
  const newProject: ProjectStub = {
    id: `proj-${offerId}`,
    source_offer_id: offerId,
    status: 'ACTIVE',
  };
  projects.push(newProject);
  return { action: 'create', targetId: newProject.id };
}

// ── Testy ─────────────────────────────────────────────────────────────────────

const projects: ProjectStub[] = [];

describe('Offers list — project action label', () => {
  beforeEach(() => {
    projects.length = 0;
  });

  it('zaakceptowana oferta BEZ projektu → wyświetla "Utwórz projekt"', () => {
    const existing = findProjectBySourceOffer(projects, 'offer-no-project');
    const label = resolveProjectActionLabel(false, existing);
    expect(label).toBe('createProject');
  });

  it('zaakceptowana oferta Z istniejącym projektem → wyświetla "Otwórz projekt"', () => {
    projects.push({ id: 'proj-1', source_offer_id: 'offer-has-project', status: 'ACTIVE' });
    const existing = findProjectBySourceOffer(projects, 'offer-has-project');
    const label = resolveProjectActionLabel(false, existing);
    expect(label).toBe('openProject');
  });

  it('podczas ładowania → wyświetla spinner (loading state)', () => {
    const label = resolveProjectActionLabel(true, null);
    expect(label).toBe('loading');
  });

  it('projekt o statusie COMPLETED → wyświetla "Otwórz projekt"', () => {
    projects.push({ id: 'proj-done', source_offer_id: 'offer-completed', status: 'COMPLETED' });
    const existing = findProjectBySourceOffer(projects, 'offer-completed');
    const label = resolveProjectActionLabel(false, existing);
    expect(label).toBe('openProject');
  });

  it('projekt o statusie ON_HOLD → wyświetla "Otwórz projekt"', () => {
    projects.push({ id: 'proj-hold', source_offer_id: 'offer-on-hold', status: 'ON_HOLD' });
    const existing = findProjectBySourceOffer(projects, 'offer-on-hold');
    const label = resolveProjectActionLabel(false, existing);
    expect(label).toBe('openProject');
  });

  it('anulowany projekt jest ignorowany → wyświetla "Utwórz projekt"', () => {
    projects.push({ id: 'proj-old', source_offer_id: 'offer-cancelled', status: 'CANCELLED' });
    const existing = findProjectBySourceOffer(projects, 'offer-cancelled');
    const label = resolveProjectActionLabel(false, existing);
    expect(label).toBe('createProject');
  });
});

describe('Offers list — "Otwórz projekt" nawigacja', () => {
  beforeEach(() => {
    projects.length = 0;
  });

  it('kliknięcie "Otwórz projekt" przekazuje ID istniejącego projektu', () => {
    projects.push({ id: 'proj-nav', source_offer_id: 'offer-nav', status: 'ACTIVE' });
    const existing = findProjectBySourceOffer(projects, 'offer-nav');
    expect(existing).not.toBeNull();
    // Symulacja kliknięcia onOpenProject(existingProject.id)
    expect(existing!.id).toBe('proj-nav');
  });
});

describe('Offers list — duplicate prevention nienaruszony', () => {
  beforeEach(() => {
    projects.length = 0;
  });

  it('handleCreateProject: oferta bez projektu → tworzy nowy projekt', () => {
    const result = simulateHandleCreateProject(projects, 'offer-new');
    expect(result.action).toBe('create');
    expect(projects).toHaveLength(1);
    expect(projects[0].source_offer_id).toBe('offer-new');
  });

  it('handleCreateProject: oferta z istniejącym projektem → redirect, brak duplikatu', () => {
    // Pre-existing project (np. stworzony przez AcceptanceLinkPanel)
    projects.push({ id: 'proj-existing', source_offer_id: 'offer-dup', status: 'ACTIVE' });

    const result = simulateHandleCreateProject(projects, 'offer-dup');
    expect(result.action).toBe('redirect');
    expect(result.targetId).toBe('proj-existing');
    expect(projects).toHaveLength(1); // duplikat NIE powstał
  });

  it('handleCreateProject: anulowany projekt nie blokuje tworzenia nowego', () => {
    projects.push({ id: 'proj-old', source_offer_id: 'offer-after-cancel', status: 'CANCELLED' });

    const result = simulateHandleCreateProject(projects, 'offer-after-cancel');
    expect(result.action).toBe('create');
    expect(projects).toHaveLength(2);
  });
});

describe('Offers list — reguła biznesowa: wiele ofert, jeden projekt', () => {
  beforeEach(() => {
    projects.length = 0;
  });

  it('różne oferty mają niezależne projekty — brak fałszywych blokad', () => {
    // offer-A, offer-B, offer-C mogą tworzyć własne projekty
    simulateHandleCreateProject(projects, 'offer-A');
    simulateHandleCreateProject(projects, 'offer-B');
    simulateHandleCreateProject(projects, 'offer-C');

    expect(projects).toHaveLength(3);
    expect(findProjectBySourceOffer(projects, 'offer-A')).not.toBeNull();
    expect(findProjectBySourceOffer(projects, 'offer-B')).not.toBeNull();
    expect(findProjectBySourceOffer(projects, 'offer-C')).not.toBeNull();
  });

  it('oferty z NULL source_offer_id nie kolidują ze sobą', () => {
    projects.push({ id: 'manual-1', source_offer_id: null, status: 'ACTIVE' });
    projects.push({ id: 'manual-2', source_offer_id: null, status: 'ACTIVE' });

    // Wiele projektów ręcznych jest dozwolone
    expect(projects.filter(p => p.source_offer_id === null)).toHaveLength(2);
    // Szukanie po konkretnej ofercie nie zwraca projektów ręcznych
    expect(findProjectBySourceOffer(projects, 'any-offer')).toBeNull();
  });
});
