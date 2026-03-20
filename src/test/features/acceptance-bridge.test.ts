/**
 * Acceptance Bridge — testy jednostkowe (PR-Ex2zp)
 *
 * Weryfikuje logikę transformacji danych przy tworzeniu v2_projects
 * z danych oferty zaakceptowanej przez approve-offer edge function.
 *
 * Testy NIE wywołują edge function — testują czyste funkcje pomocnicze
 * i kształt payloadu wstawianego do v2_projects.
 */

import { describe, it, expect } from 'vitest';

// ── Pomocnicze funkcje lokalnie odwzorowane z logiki edge function ─────────────
// (Gdyby edge function eksportowała te funkcje, importowalibyśmy je bezpośrednio.
//  Ponieważ jest to Deno runtime, testujemy tu logikę jako izolowane jednostki.)

interface LegacyProject {
  project_name?: string;
}

interface Quote {
  total?: number | null;
}

interface V2ProjectPayload {
  user_id: string;
  title: string;
  source_offer_id: string | null;
  total_from_offer: number | null;
  status: 'ACTIVE';
  progress_percent: 0;
  stages_json: never[];
  budget_net: number | null;
  budget_source: 'OFFER_NET' | null;
  budget_updated_at: string | null;
}

function buildV2ProjectPayload(
  userId: string,
  legacyProject: LegacyProject | null,
  quoteData: Quote | null,
  now: string,
  offerId: string | null = null,
): V2ProjectPayload {
  const projectTitle = legacyProject?.project_name ?? 'Projekt z oferty';
  const totalFromOffer = quoteData?.total ?? null;

  return {
    user_id: userId,
    title: projectTitle,
    source_offer_id: offerId, // PR-09-fix: teraz przekazujemy prawdziwe offers.id
    total_from_offer: totalFromOffer,
    status: 'ACTIVE',
    progress_percent: 0,
    stages_json: [],
    budget_net: totalFromOffer,
    budget_source: totalFromOffer != null ? 'OFFER_NET' : null,
    budget_updated_at: totalFromOffer != null ? now : null,
  };
}

// ── Testy ─────────────────────────────────────────────────────────────────────

describe('Acceptance Bridge — buildV2ProjectPayload', () => {
  const USER_ID = 'user-abc-123';
  const NOW = '2026-03-11T12:00:00.000Z';

  it('używa project_name z legacy projektu jako title', () => {
    const result = buildV2ProjectPayload(
      USER_ID,
      { project_name: 'Remont kuchni' },
      null,
      NOW,
    );
    expect(result.title).toBe('Remont kuchni');
  });

  it('używa domyślnego tytułu gdy legacy projekt nie ma nazwy', () => {
    const result = buildV2ProjectPayload(USER_ID, null, null, NOW);
    expect(result.title).toBe('Projekt z oferty');
  });

  it('używa domyślnego tytułu gdy project_name jest undefined', () => {
    const result = buildV2ProjectPayload(USER_ID, {}, null, NOW);
    expect(result.title).toBe('Projekt z oferty');
  });

  it('ustawia source_offer_id na offer_id gdy podane (PR-09-fix)', () => {
    const OFFER_ID = 'offer-abc-123';
    const result = buildV2ProjectPayload(
      USER_ID,
      { project_name: 'Projekt X' },
      { total: 5000 },
      NOW,
      OFFER_ID,
    );
    // PR-09-fix: source_offer_id = offer_id z offer_approvals (FK do offers)
    expect(result.source_offer_id).toBe(OFFER_ID);
  });

  it('ustawia source_offer_id na null gdy offer_id nie jest dostępne', () => {
    const result = buildV2ProjectPayload(
      USER_ID,
      { project_name: 'Projekt X' },
      { total: 5000 },
      NOW,
    );
    expect(result.source_offer_id).toBeNull();
  });

  it('ustawia total_from_offer, budget_net i budget_source z wyceny gdy dostępna', () => {
    const result = buildV2ProjectPayload(
      USER_ID,
      { project_name: 'Projekt Y' },
      { total: 12500.50 },
      NOW,
    );
    expect(result.total_from_offer).toBe(12500.50);
    expect(result.budget_net).toBe(12500.50);
    expect(result.budget_source).toBe('OFFER_NET');
    expect(result.budget_updated_at).toBe(NOW);
  });

  it('ustawia null dla pól budżetowych gdy brak wyceny', () => {
    const result = buildV2ProjectPayload(USER_ID, { project_name: 'Projekt Z' }, null, NOW);
    expect(result.total_from_offer).toBeNull();
    expect(result.budget_net).toBeNull();
    expect(result.budget_source).toBeNull();
    expect(result.budget_updated_at).toBeNull();
  });

  it('ustawia status ACTIVE i progress 0 dla nowego projektu', () => {
    const result = buildV2ProjectPayload(USER_ID, null, null, NOW);
    expect(result.status).toBe('ACTIVE');
    expect(result.progress_percent).toBe(0);
    expect(result.stages_json).toEqual([]);
  });

  it('zachowuje user_id wykonawcy', () => {
    const result = buildV2ProjectPayload(USER_ID, null, null, NOW);
    expect(result.user_id).toBe(USER_ID);
  });
});

describe('Acceptance Bridge — idempotencja', () => {
  it('nie tworzy v2_project gdy v2_project_id już istnieje', () => {
    // Symulacja logiki: if (approval.v2_project_id) return existing
    const approvalWithExistingV2 = {
      id: 'approval-1',
      v2_project_id: 'existing-v2-project-id',
    };

    // Funkcja pomocnicza powinna zwrócić istniejące ID bez tworzenia nowego
    function shouldSkipCreation(approval: { v2_project_id?: string | null }): boolean {
      return !!approval.v2_project_id;
    }

    expect(shouldSkipCreation(approvalWithExistingV2)).toBe(true);
  });

  it('tworzy v2_project gdy v2_project_id jest null', () => {
    const approvalWithoutV2 = {
      id: 'approval-2',
      v2_project_id: null,
    };

    function shouldSkipCreation(approval: { v2_project_id?: string | null }): boolean {
      return !!approval.v2_project_id;
    }

    expect(shouldSkipCreation(approvalWithoutV2)).toBe(false);
  });
});
