/**
 * Offers list — batch project lookup & IntersectionObserver auto-paginacja
 *
 * Weryfikuje logikę wprowadzoną w celu eliminacji N+1 zapytań
 * przy wyświetlaniu zaakceptowanych ofert:
 *
 * 1. useProjectsBySourceOffers — batch hydration stanu projektu
 *    - Pusta mapa gdy brak zaakceptowanych ofert (zapytanie nie wysyłane)
 *    - Poprawne mapowanie offerId → projectId dla wielu ofert naraz
 *    - Projekty CANCELLED są wykluczone z mapy (reguła biznesowa)
 *    - Projekty ON_HOLD i COMPLETED liczą się jako istniejące
 *    - Oferty bez powiązanego projektu zwracają undefined z mapy
 *
 * 2. IntersectionObserver callback — auto-paginacja listy ofert
 *    - fetchNextPage wywołany gdy sentinel widoczny + hasNextPage=true
 *    - fetchNextPage NIE wywołany gdy sentinel poza ekranem
 *    - fetchNextPage NIE wywołany gdy hasNextPage=false (koniec listy)
 *    - fetchNextPage NIE wywołany gdy isFetchingNextPage=true (ochrona)
 *
 * Testy oparte na czystej logice decyzyjnej (bez renderowania komponentu)
 * — spójne z wzorcem z offers-list-project-action.test.ts.
 */

import { describe, it, expect, vi } from 'vitest';

// ── Typy stub ─────────────────────────────────────────────────────────────────

interface ProjectStub {
  id: string;
  source_offer_id: string | null;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
}

// ── Czysta logika batch lookup (odpowiednik queryFn useProjectsBySourceOffers) ─

/**
 * Mirrors the queryFn in useProjectsBySourceOffers:
 * Filtruje projekty w pamięci identycznie jak zapytanie Supabase:
 *   .in('source_offer_id', offerIds).neq('status', 'CANCELLED')
 * i zwraca Map<offerId, projectId>.
 */
function buildProjectMap(
  projects: ProjectStub[],
  offerIds: string[],
): Map<string, string> {
  if (offerIds.length === 0) return new Map();
  return new Map(
    projects
      .filter(
        (p) =>
          p.source_offer_id !== null &&
          offerIds.includes(p.source_offer_id) &&
          p.status !== 'CANCELLED',
      )
      .map((p) => [p.source_offer_id as string, p.id]),
  );
}

// ── Czysta logika callback IntersectionObserver ───────────────────────────────

/**
 * Mirrors the IntersectionObserver callback in Offers.tsx useEffect:
 *   if (isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage()
 */
function buildIntersectionCallback(
  fetchNextPage: () => void,
  getHasNextPage: () => boolean,
  getIsFetching: () => boolean,
) {
  return (entries: { isIntersecting: boolean }[]) => {
    if (entries[0].isIntersecting && getHasNextPage() && !getIsFetching()) {
      fetchNextPage();
    }
  };
}

// ── Testy: batch project lookup ───────────────────────────────────────────────

describe('useProjectsBySourceOffers — logika batch lookup', () => {
  const projects: ProjectStub[] = [
    { id: 'proj-1', source_offer_id: 'offer-1', status: 'ACTIVE' },
    { id: 'proj-2', source_offer_id: 'offer-2', status: 'COMPLETED' },
    { id: 'proj-cancelled', source_offer_id: 'offer-3', status: 'CANCELLED' },
    { id: 'proj-4', source_offer_id: 'offer-4', status: 'ON_HOLD' },
  ];

  it('zwraca pustą mapę gdy lista offerIds jest pusta (brak ACCEPTED ofert)', () => {
    const result = buildProjectMap(projects, []);
    expect(result.size).toBe(0);
  });

  it('zwraca poprawne mapowanie offerId → projectId dla jednej oferty', () => {
    const result = buildProjectMap(projects, ['offer-1']);
    expect(result.get('offer-1')).toBe('proj-1');
    expect(result.size).toBe(1);
  });

  it('jedno batch zapytanie obsługuje wiele ofert naraz', () => {
    const result = buildProjectMap(projects, ['offer-1', 'offer-2', 'offer-4']);
    expect(result.get('offer-1')).toBe('proj-1');
    expect(result.get('offer-2')).toBe('proj-2');
    expect(result.get('offer-4')).toBe('proj-4');
    expect(result.size).toBe(3);
  });

  it('projekty o statusie CANCELLED są wykluczone z mapy', () => {
    const result = buildProjectMap(projects, ['offer-3']);
    expect(result.has('offer-3')).toBe(false);
    expect(result.size).toBe(0);
  });

  it('projekty COMPLETED i ON_HOLD są traktowane jako istniejące', () => {
    const result = buildProjectMap(projects, ['offer-2', 'offer-4']);
    expect(result.get('offer-2')).toBe('proj-2');
    expect(result.get('offer-4')).toBe('proj-4');
  });

  it('oferta bez powiązanego projektu zwraca undefined z mapy', () => {
    const result = buildProjectMap(projects, ['offer-no-project']);
    expect(result.get('offer-no-project')).toBeUndefined();
  });

  it('CANCELLED projekt nie blokuje oferty — zwraca undefined, nie stary projekt', () => {
    const result = buildProjectMap(projects, ['offer-3']);
    // offer-3 ma CANCELLED projekt — OfferRow powinien pokazać "Utwórz projekt"
    expect(result.get('offer-3')).toBeUndefined();
  });
});

// ── Testy: IntersectionObserver auto-paginacja ────────────────────────────────

describe('IntersectionObserver — auto-paginacja listy ofert', () => {
  it('wywołuje fetchNextPage gdy sentinel jest widoczny i hasNextPage=true', () => {
    const fetchNextPage = vi.fn();
    const cb = buildIntersectionCallback(
      fetchNextPage,
      () => true,
      () => false,
    );
    cb([{ isIntersecting: true }]);
    expect(fetchNextPage).toHaveBeenCalledOnce();
  });

  it('NIE wywołuje fetchNextPage gdy sentinel jest poza ekranem', () => {
    const fetchNextPage = vi.fn();
    const cb = buildIntersectionCallback(
      fetchNextPage,
      () => true,
      () => false,
    );
    cb([{ isIntersecting: false }]);
    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it('NIE wywołuje fetchNextPage gdy hasNextPage=false (koniec listy)', () => {
    const fetchNextPage = vi.fn();
    const cb = buildIntersectionCallback(
      fetchNextPage,
      () => false,
      () => false,
    );
    cb([{ isIntersecting: true }]);
    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it('NIE wywołuje fetchNextPage gdy isFetchingNextPage=true (ochrona podwójnego wywołania)', () => {
    const fetchNextPage = vi.fn();
    const cb = buildIntersectionCallback(
      fetchNextPage,
      () => true,
      () => true,
    );
    cb([{ isIntersecting: true }]);
    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it('NIE wywołuje fetchNextPage gdy koniec listy i trwa pobieranie (oba warunki false)', () => {
    const fetchNextPage = vi.fn();
    const cb = buildIntersectionCallback(
      fetchNextPage,
      () => false,
      () => true,
    );
    cb([{ isIntersecting: true }]);
    expect(fetchNextPage).not.toHaveBeenCalled();
  });
});
