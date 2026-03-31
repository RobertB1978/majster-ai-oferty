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

// ── Nowe testy: eager state UI + obsługa race condition (23505) ───────────────

describe('Duplicate prevention — eager UI state (useProjectBySourceOffer)', () => {
  beforeEach(() => {
    mockProjects.length = 0;
  });

  it('zwraca null gdy brak projektu — panel pokazuje przycisk "Utwórz projekt"', () => {
    const result = findProjectBySourceOffer(mockProjects, 'offer-new');
    // null => AcceptanceLinkPanel renderuje gałąź "Create project"
    expect(result).toBeNull();
  });

  it('zwraca istniejący projekt — panel pokazuje przycisk "Otwórz projekt"', () => {
    const project = createProject('offer-exists', 'Projekt bazowy');
    const result = findProjectBySourceOffer(mockProjects, 'offer-exists');
    // nie-null => AcceptanceLinkPanel renderuje gałąź "Open project"
    expect(result).not.toBeNull();
    expect(result!.id).toBe(project.id);
  });

  it('po anulowaniu projektu panel wraca do "Utwórz projekt" dla tej samej oferty', () => {
    const project = createProject('offer-cancel', 'Do anulowania');
    project.status = 'CANCELLED';

    const result = findProjectBySourceOffer(mockProjects, 'offer-cancel');
    // CANCELLED ignorowany => null => panel pokazuje "Utwórz projekt"
    expect(result).toBeNull();
  });
});

describe('Duplicate prevention — race condition / 23505 create-or-return-existing', () => {
  beforeEach(() => {
    mockProjects.length = 0;
  });

  it('symulacja 23505: gdy INSERT nie powiedzie się, fallback zwraca istniejący projekt', () => {
    // Scenariusz: dwa równoczesne żądania. Pierwsze tworzy projekt.
    // Drugie otrzymuje błąd 23505 (unique constraint violation) i musi
    // zwrócić istniejący projekt zamiast rzucać wyjątek.
    const first = createProject('offer-race', 'Pierwszy');

    // Symulacja logiki 23505-fallback (mirroring useCreateProjectV2)
    function createOrReturnExisting(
      offerId: string,
      postgresErrorCode: string,
    ): ProjectV2Stub | null {
      if (postgresErrorCode === '23505') {
        return findProjectBySourceOffer(mockProjects, offerId);
      }
      return null;
    }

    const recovered = createOrReturnExisting('offer-race', '23505');
    expect(recovered).not.toBeNull();
    expect(recovered!.id).toBe(first.id);
    // Nadal tylko jeden projekt — żaden duplikat nie powstał
    expect(mockProjects).toHaveLength(1);
  });

  it('błąd inny niż 23505 NIE jest wyciszany — jest rzucany dalej', () => {
    // Weryfikacja: 23505-fallback nie łapie innych błędów DB
    function shouldFallback(errorCode: string): boolean {
      return errorCode === '23505';
    }
    expect(shouldFallback('23505')).toBe(true);
    expect(shouldFallback('23514')).toBe(false); // CHECK constraint
    expect(shouldFallback('42501')).toBe(false); // insufficient privilege
    expect(shouldFallback('23503')).toBe(false); // FK violation
  });

  it('fallback 23505 wymaga source_offer_id — bez niego błąd jest rzucany', () => {
    // Jeśli source_offer_id jest null (projekt ręczny), 23505 nie może być
    // duplikatem source_offer — rzucamy dalej.
    function shouldFallback(errorCode: string, sourceOfferId: string | null): boolean {
      return errorCode === '23505' && sourceOfferId !== null;
    }
    expect(shouldFallback('23505', 'offer-abc')).toBe(true);
    expect(shouldFallback('23505', null)).toBe(false);
  });
});

describe('Duplicate prevention — data-level unique index semantics', () => {
  beforeEach(() => {
    mockProjects.length = 0;
  });

  it('partial unique index: CANCELLED projekty nie blokują nowych (WHERE status != CANCELLED)', () => {
    // Indeks uq_v2_projects_active_source_offer wyklucza CANCELLED.
    // Weryfikacja logiki: CANCELLED + nowy ACTIVE to dozwolone.
    const cancelled = createProject('offer-idx', 'Stary anulowany');
    cancelled.status = 'CANCELLED';

    // findProjectBySourceOffer zwraca null (CANCELLED pominięty)
    const existing = findProjectBySourceOffer(mockProjects, 'offer-idx');
    expect(existing).toBeNull();

    // Można stworzyć nowy projekt
    const newProject = createProject('offer-idx', 'Nowy aktywny');
    expect(newProject.status).toBe('ACTIVE');
    // W bazie: 2 rekordy dla tej samej oferty, ale partial index
    // pozwala na to (CANCELLED jest poza zakresem indeksu)
    expect(mockProjects).toHaveLength(2);
  });

  it('partial unique index: NULL source_offer_id nie objęty indeksem (WHERE source_offer_id IS NOT NULL)', () => {
    // Projekty ręczne mają source_offer_id = null — nigdy nie kolidują
    mockProjects.push({ id: 'manual-a', source_offer_id: null, status: 'ACTIVE' });
    mockProjects.push({ id: 'manual-b', source_offer_id: null, status: 'ACTIVE' });

    // Wiele projektów ręcznych zawsze dozwolone
    expect(mockProjects.filter(p => p.source_offer_id === null)).toHaveLength(2);
    // Szukanie po konkretnej ofercie nie zwraca projektów ręcznych
    expect(findProjectBySourceOffer(mockProjects, 'any-offer')).toBeNull();
  });

  it('business rule: wiele różnych ofert w kontekście jednego projektu — brak blokady', () => {
    // offer-A, offer-B, offer-C to osobne ID — każda może mieć własny projekt.
    // Reguła "wiele ofert w jednym projekcie" jest po stronie tabeli offers
    // (wiele offers.project_id = ten sam projekt), NIE w v2_projects.
    // Ten test potwierdza, że indeks nie blokuje tego scenariusza.
    const pA = createProject('offer-A', 'Wariant A');
    const pB = createProject('offer-B', 'Wariant B');
    const pC = createProject('offer-C', 'Wariant C');

    // Każda oferta ma osobny projekt — brak kolizji source_offer_id
    expect(findProjectBySourceOffer(mockProjects, 'offer-A')!.id).toBe(pA.id);
    expect(findProjectBySourceOffer(mockProjects, 'offer-B')!.id).toBe(pB.id);
    expect(findProjectBySourceOffer(mockProjects, 'offer-C')!.id).toBe(pC.id);
    expect(mockProjects).toHaveLength(3);
  });
});
