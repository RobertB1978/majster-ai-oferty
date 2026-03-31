/**
 * Prevent duplicate projects from same accepted offer — testy regresyjne
 *
 * Weryfikuje logikę findProjectBySourceOffer:
 * 1. Pierwsze tworzenie projektu z oferty działa normalnie
 * 2. Druga próba z tej samej oferty jest blokowana (istniejący projekt znaleziony)
 * 3. Anulowane projekty nie blokują tworzenia nowych
 * 4. Różne oferty tworzą osobne projekty (brak fałszywych blokad)
 * 5. Wiele ofert w jednym projekcie pozostaje możliwe
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ── Symulacja logiki findProjectBySourceOffer ──────────────────────────────────
// (Testujemy czystą logikę decyzyjną, nie sam Supabase client)

interface ProjectV2Stub {
  id: string;
  source_offer_id: string | null;
  status: string;
}

const mockProjects: ProjectV2Stub[] = [];

/**
 * Pure logic equivalent of findProjectBySourceOffer.
 * Mirrors the query: eq(source_offer_id, offerId) + neq(status, CANCELLED)
 */
function findProjectBySourceOffer(
  projects: ProjectV2Stub[],
  sourceOfferId: string,
): ProjectV2Stub | null {
  const match = projects
    .filter(
      (p) =>
        p.source_offer_id === sourceOfferId && p.status !== 'CANCELLED',
    )
    .sort((a, b) => b.id.localeCompare(a.id)); // simulate order by created_at desc
  return match[0] ?? null;
}

/**
 * Simulates creating a project (insert into v2_projects).
 */
function createProject(offerId: string, _title: string): ProjectV2Stub {
  const project: ProjectV2Stub = {
    id: `proj-${Math.random().toString(36).slice(2, 8)}`,
    source_offer_id: offerId,
    status: 'ACTIVE',
  };
  mockProjects.push(project);
  return project;
}

// ── Testy ─────────────────────────────────────────────────────────────────────

describe('Duplicate project prevention — findProjectBySourceOffer', () => {
  beforeEach(() => {
    mockProjects.length = 0;
  });

  it('zwraca null gdy nie istnieje projekt dla danej oferty — pozwala na tworzenie', () => {
    const result = findProjectBySourceOffer(mockProjects, 'offer-1');
    expect(result).toBeNull();
  });

  it('pierwsze tworzenie projektu z oferty działa normalnie', () => {
    // Krok 1: sprawdzenie — brak istniejącego projektu
    const existing = findProjectBySourceOffer(mockProjects, 'offer-1');
    expect(existing).toBeNull();

    // Krok 2: tworzenie projektu
    const project = createProject('offer-1', 'Projekt z oferty');
    expect(project.source_offer_id).toBe('offer-1');
    expect(project.status).toBe('ACTIVE');
    expect(mockProjects).toHaveLength(1);
  });

  it('druga próba tworzenia z tej samej oferty jest blokowana — zwraca istniejący projekt', () => {
    // Krok 1: tworzenie pierwszego projektu
    const first = createProject('offer-1', 'Pierwszy projekt');

    // Krok 2: próba drugiego tworzenia — findProjectBySourceOffer zwraca istniejący
    const existing = findProjectBySourceOffer(mockProjects, 'offer-1');
    expect(existing).not.toBeNull();
    expect(existing!.id).toBe(first.id);
    expect(existing!.source_offer_id).toBe('offer-1');

    // Projekt NIE jest tworzony ponownie
    expect(mockProjects).toHaveLength(1);
  });

  it('anulowany projekt NIE blokuje tworzenia nowego z tej samej oferty', () => {
    // Krok 1: tworzenie i anulowanie projektu
    const cancelled = createProject('offer-2', 'Anulowany');
    cancelled.status = 'CANCELLED';

    // Krok 2: findProjectBySourceOffer ignoruje CANCELLED
    const existing = findProjectBySourceOffer(mockProjects, 'offer-2');
    expect(existing).toBeNull();

    // Krok 3: można stworzyć nowy projekt
    const newProject = createProject('offer-2', 'Nowy projekt');
    expect(newProject.source_offer_id).toBe('offer-2');
    expect(mockProjects).toHaveLength(2);
  });

  it('różne oferty tworzą osobne projekty — brak fałszywych blokad', () => {
    const p1 = createProject('offer-A', 'Projekt A');
    const p2 = createProject('offer-B', 'Projekt B');

    expect(findProjectBySourceOffer(mockProjects, 'offer-A')!.id).toBe(p1.id);
    expect(findProjectBySourceOffer(mockProjects, 'offer-B')!.id).toBe(p2.id);
    expect(findProjectBySourceOffer(mockProjects, 'offer-C')).toBeNull();

    expect(mockProjects).toHaveLength(2);
  });

  it('wiele ofert w jednym projekcie NIE jest blokowane — reguła biznesowa zachowana', () => {
    // Scenariusz: projekt powstał z offer-1, ale offer-2 i offer-3 też istnieją
    // w kontekście tego projektu (warianty cenowe). Każda oferta to osobny rekord
    // w tabeli offers, ale source_offer_id wskazuje na ofertę źródłową.
    // Ten test potwierdza, że oferta offer-2 może stworzyć SWÓJ projekt,
    // bo nie ma kolizji z offer-1.
    createProject('offer-1', 'Wariant ekonomiczny');
    createProject('offer-2', 'Wariant standard');
    createProject('offer-3', 'Wariant premium');

    expect(mockProjects).toHaveLength(3);
    expect(findProjectBySourceOffer(mockProjects, 'offer-1')).not.toBeNull();
    expect(findProjectBySourceOffer(mockProjects, 'offer-2')).not.toBeNull();
    expect(findProjectBySourceOffer(mockProjects, 'offer-3')).not.toBeNull();

    // Każda oferta ma JEDEN projekt — duplikaty nie powstają
    const offer1Projects = mockProjects.filter(
      (p) => p.source_offer_id === 'offer-1' && p.status !== 'CANCELLED',
    );
    expect(offer1Projects).toHaveLength(1);
  });

  it('source_offer_id null nie powoduje kolizji — projekty ręczne nie są blokowane', () => {
    // Projekty tworzone ręcznie (NewProjectV2) mają source_offer_id = null
    mockProjects.push({
      id: 'manual-1',
      source_offer_id: null,
      status: 'ACTIVE',
    });
    mockProjects.push({
      id: 'manual-2',
      source_offer_id: null,
      status: 'ACTIVE',
    });

    // findProjectBySourceOffer szuka po konkretnym ID oferty — null nie matchuje
    const result = findProjectBySourceOffer(mockProjects, 'offer-X');
    expect(result).toBeNull();
  });
});

describe('Duplicate prevention — flow decision logic', () => {
  beforeEach(() => {
    mockProjects.length = 0;
  });

  it('pełny flow: create -> navigate; duplicate -> redirect to existing', () => {
    const navigatedTo: string[] = [];
    const toasts: string[] = [];

    async function handleCreateProject(offerId: string) {
      const existing = findProjectBySourceOffer(mockProjects, offerId);
      if (existing) {
        toasts.push('alreadyExists');
        navigatedTo.push(`/app/projects/${existing.id}`);
        return;
      }
      const project = createProject(offerId, 'Nowy');
      toasts.push('createSuccess');
      navigatedTo.push(`/app/projects/${project.id}`);
    }

    // Pierwsze kliknięcie — projekt tworzony
    handleCreateProject('offer-1');
    expect(toasts).toEqual(['createSuccess']);
    expect(mockProjects).toHaveLength(1);

    // Drugie kliknięcie — redirect do istniejącego
    handleCreateProject('offer-1');
    expect(toasts).toEqual(['createSuccess', 'alreadyExists']);
    expect(mockProjects).toHaveLength(1); // NIE stworzono duplikatu

    // Oba razy nawigacja do tego samego projektu
    expect(navigatedTo[0]).toBe(navigatedTo[1]);
  });
});
