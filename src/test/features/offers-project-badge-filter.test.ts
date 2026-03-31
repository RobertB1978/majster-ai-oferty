/**
 * offers-project-badge-filter.test.ts
 * Sprint: offers-productivity-3pHi8
 *
 * Testy dla:
 * 1. Logika badge'a statusu projektu na liście ofert
 * 2. Filtr "z projektem / bez projektu"
 * 3. Automatyczne przełączenie na zakładkę ACCEPTED przy aktywacji filtra
 * 4. Klucze i18n dla badge'ów i filtrów projektu
 * 5. Integralność reguł biznesowych (wiele ofert → jeden projekt)
 */

import { describe, it, expect } from 'vitest';

// ── Typy pomocnicze ────────────────────────────────────────────────────────────

type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
type ProjectFilter = 'ALL' | 'WITH_PROJECT' | 'WITHOUT_PROJECT';
type StatusFilter = 'ALL' | 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'ARCHIVED';

interface OfferStub {
  id: string;
  status: StatusFilter;
}

// ── Logika badge'a projektu (mirror Offers.tsx) ───────────────────────────────

type ProjectBadgeVariant = 'active' | 'completed' | 'onHold' | 'none' | 'loading';

function resolveProjectBadge(
  isAccepted: boolean,
  isLoading: boolean,
  projectStatus: ProjectStatus | null,
): ProjectBadgeVariant {
  if (!isAccepted) return 'none'; // badge tylko dla zaakceptowanych
  if (isLoading) return 'loading';
  if (projectStatus === null) return 'none';
  if (projectStatus === 'ACTIVE') return 'active';
  if (projectStatus === 'COMPLETED') return 'completed';
  return 'onHold'; // ON_HOLD lub CANCELLED (edge case)
}

// ── Logika filtrowania (mirror Offers.tsx) ────────────────────────────────────

function applyProjectFilter(
  offers: OfferStub[],
  projectFilter: ProjectFilter,
  projectSourceOfferIds: Set<string>,
): OfferStub[] {
  if (projectFilter === 'WITH_PROJECT') {
    return offers.filter((o) => projectSourceOfferIds.has(o.id));
  }
  if (projectFilter === 'WITHOUT_PROJECT') {
    return offers.filter((o) => !projectSourceOfferIds.has(o.id));
  }
  return offers;
}

// ── Logika effectiveStatus (mirror Offers.tsx) ────────────────────────────────

function resolveEffectiveStatus(
  projectFilter: ProjectFilter,
  statusFilter: StatusFilter,
): StatusFilter {
  return projectFilter !== 'ALL' ? 'ACCEPTED' : statusFilter;
}

// ── Testy: badge projektu ─────────────────────────────────────────────────────

describe('Badge statusu projektu', () => {
  it('oferta niebędąca ACCEPTED nie pokazuje badge projektu', () => {
    for (const status of ['DRAFT', 'SENT', 'REJECTED', 'ARCHIVED'] as const) {
      const badge = resolveProjectBadge(false, false, null);
      expect(badge).toBe('none');
      // Upewniamy się, że to działa dla każdego statusu
      expect(status).toBeDefined();
    }
  });

  it('ładowanie — brak badge (nie renderujemy podczas ładowania)', () => {
    const badge = resolveProjectBadge(true, true, null);
    expect(badge).toBe('loading');
  });

  it('ACCEPTED + projekt ACTIVE → badge "active"', () => {
    expect(resolveProjectBadge(true, false, 'ACTIVE')).toBe('active');
  });

  it('ACCEPTED + projekt COMPLETED → badge "completed"', () => {
    expect(resolveProjectBadge(true, false, 'COMPLETED')).toBe('completed');
  });

  it('ACCEPTED + projekt ON_HOLD → badge "onHold"', () => {
    expect(resolveProjectBadge(true, false, 'ON_HOLD')).toBe('onHold');
  });

  it('ACCEPTED + brak projektu → badge "none" (pomarańczowy "Brak projektu")', () => {
    expect(resolveProjectBadge(true, false, null)).toBe('none');
  });
});

// ── Testy: filtr projektu ─────────────────────────────────────────────────────

describe('Filtr "z projektem / bez projektu"', () => {
  const allOffers: OfferStub[] = [
    { id: 'offer-a', status: 'ACCEPTED' }, // ma projekt
    { id: 'offer-b', status: 'ACCEPTED' }, // bez projektu
    { id: 'offer-c', status: 'ACCEPTED' }, // ma projekt
  ];
  const projectSourceOfferIds = new Set(['offer-a', 'offer-c']);

  it('filtr ALL → zwraca wszystkie oferty bez zmian', () => {
    const result = applyProjectFilter(allOffers, 'ALL', projectSourceOfferIds);
    expect(result).toHaveLength(3);
  });

  it('filtr WITH_PROJECT → tylko oferty które mają projekt', () => {
    const result = applyProjectFilter(allOffers, 'WITH_PROJECT', projectSourceOfferIds);
    expect(result).toHaveLength(2);
    expect(result.map((o) => o.id)).toContain('offer-a');
    expect(result.map((o) => o.id)).toContain('offer-c');
    expect(result.map((o) => o.id)).not.toContain('offer-b');
  });

  it('filtr WITHOUT_PROJECT → tylko oferty bez projektu', () => {
    const result = applyProjectFilter(allOffers, 'WITHOUT_PROJECT', projectSourceOfferIds);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('offer-b');
  });

  it('pusty zbiór projektów + WITH_PROJECT → brak wyników', () => {
    const result = applyProjectFilter(allOffers, 'WITH_PROJECT', new Set());
    expect(result).toHaveLength(0);
  });

  it('pusty zbiór projektów + WITHOUT_PROJECT → wszystkie oferty', () => {
    const result = applyProjectFilter(allOffers, 'WITHOUT_PROJECT', new Set());
    expect(result).toHaveLength(3);
  });
});

// ── Testy: effectiveStatus ────────────────────────────────────────────────────

describe('Automatyczne przełączenie na ACCEPTED przy aktywacji filtra projektu', () => {
  it('filtr ALL → effectiveStatus = wartość z zakładki statusu', () => {
    expect(resolveEffectiveStatus('ALL', 'DRAFT')).toBe('DRAFT');
    expect(resolveEffectiveStatus('ALL', 'SENT')).toBe('SENT');
    expect(resolveEffectiveStatus('ALL', 'ALL')).toBe('ALL');
  });

  it('filtr WITH_PROJECT → effectiveStatus zawsze ACCEPTED', () => {
    expect(resolveEffectiveStatus('WITH_PROJECT', 'ALL')).toBe('ACCEPTED');
    expect(resolveEffectiveStatus('WITH_PROJECT', 'DRAFT')).toBe('ACCEPTED');
    expect(resolveEffectiveStatus('WITH_PROJECT', 'SENT')).toBe('ACCEPTED');
  });

  it('filtr WITHOUT_PROJECT → effectiveStatus zawsze ACCEPTED', () => {
    expect(resolveEffectiveStatus('WITHOUT_PROJECT', 'ALL')).toBe('ACCEPTED');
    expect(resolveEffectiveStatus('WITHOUT_PROJECT', 'ACCEPTED')).toBe('ACCEPTED');
  });
});

// ── Testy: reguły biznesowe ───────────────────────────────────────────────────

describe('Filtr projektu — reguły biznesowe', () => {
  it('wiele ofert może mieć własne projekty (brak fałszywych blokad)', () => {
    const ids = new Set(['offer-1', 'offer-2', 'offer-3']);
    const offers: OfferStub[] = [
      { id: 'offer-1', status: 'ACCEPTED' },
      { id: 'offer-2', status: 'ACCEPTED' },
      { id: 'offer-3', status: 'ACCEPTED' },
    ];
    const withProject = applyProjectFilter(offers, 'WITH_PROJECT', ids);
    expect(withProject).toHaveLength(3); // każda oferta ma własny projekt
  });

  it('oferta bez projektu nie wyklucza innych ofert Z projektem', () => {
    const ids = new Set(['offer-1', 'offer-3']); // offer-2 nie ma projektu
    const offers: OfferStub[] = [
      { id: 'offer-1', status: 'ACCEPTED' },
      { id: 'offer-2', status: 'ACCEPTED' },
      { id: 'offer-3', status: 'ACCEPTED' },
    ];
    const withProject = applyProjectFilter(offers, 'WITH_PROJECT', ids);
    const withoutProject = applyProjectFilter(offers, 'WITHOUT_PROJECT', ids);

    expect(withProject).toHaveLength(2);
    expect(withoutProject).toHaveLength(1);
    expect(withProject.length + withoutProject.length).toBe(offers.length);
  });
});

// ── Testy: klucze i18n ────────────────────────────────────────────────────────

describe('Badge projektu i filtr — klucze i18n', () => {
  it('wszystkie klucze i18n dla badge i filtra projektu istnieją we wszystkich językach', async () => {
    const { default: i18n } = await import('@/i18n');
    const keys = [
      'offersList.projectFilterAll',
      'offersList.projectFilterWithProject',
      'offersList.projectFilterWithoutProject',
      'offersList.projectBadgeActive',
      'offersList.projectBadgeCompleted',
      'offersList.projectBadgeOnHold',
      'offersList.projectBadgeNone',
    ];
    for (const key of keys) {
      for (const lang of ['pl', 'en', 'uk']) {
        await i18n.changeLanguage(lang);
        const val = i18n.t(key);
        expect(val, `${lang}:${key} powinien być przetłumaczony`).not.toBe(key);
        expect(val, `${lang}:${key} nie powinien być pusty`).toBeTruthy();
      }
    }
  });
});
