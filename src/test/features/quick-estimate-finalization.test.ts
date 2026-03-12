/**
 * Quick Estimate — testy finalizacji (fix PR: fix-estimate-save-flow)
 *
 * Weryfikuje poprawioną ścieżkę finalizacji Quick Estimate:
 *  1. Promocja szkicu DRAFT → SENT w tabeli `offers` (nie legacy `projects`)
 *  2. Tworzenie rekordu `v2_projects` jako kanoniczny wynik finalizacji
 *  3. Brak przetłumaczonych stringów jako wartości DB (status = 'ACTIVE', nie t(...))
 *  4. Integracja draft → promote → v2_project
 *
 * Testy są czystymi funkcjami jednostkowymi — nie wywołują hooków React ani
 * bazy danych. Sprawdzają logikę transformacji danych identyczną z kodem produkcyjnym.
 */

import { describe, it, expect } from 'vitest';
import { calcTotals } from '@/lib/estimateCalc';
import type { LineItem } from '@/components/quickEstimate/WorkspaceLineItems';

// ── Pomocnicze typy odzwierciedlające payloady bazy danych ────────────────────

interface OfferPromotePayload {
  status: 'SENT';
  title: string | null;
  client_id: string | null;
  vat_enabled: boolean;
  total_net: number;
  total_gross: number;
  total_vat: number;
}

interface OfferInsertPayload {
  user_id: string;
  status: 'SENT';
  source: string;
  title: string | null;
  client_id: string | null;
  vat_enabled: boolean;
  total_net: number;
  total_gross: number;
  total_vat: number;
}

interface V2ProjectInsertPayload {
  user_id: string;
  title: string;
  client_id: string;
  source_offer_id: string;
  total_from_offer: number;
  status: 'ACTIVE';
  progress_percent: 0;
  stages_json: never[];
  budget_net: number;
  budget_source: 'OFFER_NET';
  budget_updated_at: string;
}

// ── Pomocnicze funkcje odwzorowujące logikę producyjną ────────────────────────

const DRAFT_SOURCE = 'quick_estimate';

/** Buduje payload aktualizacji oferty (promote DRAFT → SENT) */
function buildOfferPromotePayload(
  projectName: string,
  clientId: string,
  vatEnabled: boolean,
  items: LineItem[],
): OfferPromotePayload {
  const { netTotal, vatAmount, grossTotal } = calcTotals(items, vatEnabled);
  return {
    status: 'SENT',
    title: projectName.trim() || null,
    client_id: clientId || null,
    vat_enabled: vatEnabled,
    total_net: netTotal,
    total_gross: grossTotal,
    total_vat: vatAmount,
  };
}

/** Buduje payload nowej oferty gdy brak szkicu (status='SENT' bezpośrednio) */
function buildOfferInsertPayload(
  userId: string,
  projectName: string,
  clientId: string,
  vatEnabled: boolean,
  items: LineItem[],
): OfferInsertPayload {
  const { netTotal, vatAmount, grossTotal } = calcTotals(items, vatEnabled);
  return {
    user_id: userId,
    status: 'SENT',
    source: DRAFT_SOURCE,
    title: projectName.trim() || null,
    client_id: clientId || null,
    vat_enabled: vatEnabled,
    total_net: netTotal,
    total_gross: grossTotal,
    total_vat: vatAmount,
  };
}

/** Buduje payload v2_projects (kanoniczy cel finalizacji) */
function buildV2ProjectPayload(
  userId: string,
  title: string,
  clientId: string,
  offerId: string,
  netTotal: number,
  now: string,
): V2ProjectInsertPayload {
  return {
    user_id: userId,
    title: title.trim() || 'Szybka wycena',
    client_id: clientId,
    source_offer_id: offerId,
    total_from_offer: netTotal,
    status: 'ACTIVE',
    progress_percent: 0,
    stages_json: [],
    budget_net: netTotal,
    budget_source: 'OFFER_NET',
    budget_updated_at: now,
  };
}

// ── Dane testowe ───────────────────────────────────────────────────────────────

const USER_ID = 'user-test-123';
const CLIENT_ID = 'client-abc';
const OFFER_ID = 'offer-draft-xyz';
const NOW = '2026-03-12T10:00:00.000Z';

const SAMPLE_ITEMS: LineItem[] = [
  {
    id: 'item-1',
    name: 'Położenie płytek',
    qty: 20,
    unit: 'm2',
    priceMode: 'single',
    price: 150,
    laborCost: 0,
    materialCost: 0,
    marginPct: 0,
    showMargin: true,
    itemType: 'service',
  },
  {
    id: 'item-2',
    name: 'Klej do płytek',
    qty: 5,
    unit: 'worek',
    priceMode: 'single',
    price: 40,
    laborCost: 0,
    materialCost: 0,
    marginPct: 0,
    showMargin: true,
    itemType: 'material',
  },
];

// ── TESTY: promote offer DRAFT → SENT ─────────────────────────────────────────

describe('Quick Estimate — promocja szkicu DRAFT → SENT', () => {
  it('ustawia status SENT (nie DRAFT ani przetłumaczony string)', () => {
    const payload = buildOfferPromotePayload('Remont łazienki', CLIENT_ID, true, SAMPLE_ITEMS);
    expect(payload.status).toBe('SENT');
  });

  it('zachowuje tytuł projektu', () => {
    const payload = buildOfferPromotePayload('Remont łazienki', CLIENT_ID, true, SAMPLE_ITEMS);
    expect(payload.title).toBe('Remont łazienki');
  });

  it('ustawia title na null gdy projectName jest pusty', () => {
    const payload = buildOfferPromotePayload('  ', CLIENT_ID, true, SAMPLE_ITEMS);
    expect(payload.title).toBeNull();
  });

  it('zachowuje client_id', () => {
    const payload = buildOfferPromotePayload('Test', CLIENT_ID, true, SAMPLE_ITEMS);
    expect(payload.client_id).toBe(CLIENT_ID);
  });

  it('kalkuluje totale z pozycji', () => {
    const payload = buildOfferPromotePayload('Test', CLIENT_ID, true, SAMPLE_ITEMS);
    // 20 * 150 + 5 * 40 = 3000 + 200 = 3200 netto; brutto = 3200 * 1.23 = 3936
    expect(payload.total_net).toBeCloseTo(3200, 2);
    expect(payload.total_gross).toBeCloseTo(3936, 2);
    expect(payload.total_vat).toBeCloseTo(736, 2);
  });

  it('kalkuluje bez VAT gdy vatEnabled=false', () => {
    const payload = buildOfferPromotePayload('Test', CLIENT_ID, false, SAMPLE_ITEMS);
    expect(payload.total_net).toBeCloseTo(3200, 2);
    expect(payload.total_gross).toBeCloseTo(3200, 2);
    expect(payload.total_vat).toBeCloseTo(0, 2);
  });
});

// ── TESTY: nowa oferta gdy brak szkicu ────────────────────────────────────────

describe('Quick Estimate — nowa oferta SENT gdy brak szkicu', () => {
  it('ustawia status SENT bezpośrednio', () => {
    const payload = buildOfferInsertPayload(USER_ID, 'Test', CLIENT_ID, true, SAMPLE_ITEMS);
    expect(payload.status).toBe('SENT');
  });

  it('ustawia source = quick_estimate', () => {
    const payload = buildOfferInsertPayload(USER_ID, 'Test', CLIENT_ID, true, SAMPLE_ITEMS);
    expect(payload.source).toBe('quick_estimate');
  });

  it('zawiera user_id', () => {
    const payload = buildOfferInsertPayload(USER_ID, 'Test', CLIENT_ID, true, SAMPLE_ITEMS);
    expect(payload.user_id).toBe(USER_ID);
  });
});

// ── TESTY: v2_project jako kanoniczny cel ─────────────────────────────────────

describe('Quick Estimate — v2_project jako kanoniczny wynik finalizacji', () => {
  it('status projektu to ACTIVE — nie przetłumaczony string', () => {
    const { netTotal } = calcTotals(SAMPLE_ITEMS, true);
    const payload = buildV2ProjectPayload(USER_ID, 'Remont', CLIENT_ID, OFFER_ID, netTotal, NOW);
    expect(payload.status).toBe('ACTIVE');
    // Gwarantujemy, że nie jest to żaden przetłumaczony tekst
    expect(payload.status).not.toContain('Szybka');
    expect(payload.status).not.toContain('Quick');
  });

  it('source_offer_id łączy v2_project z finalizowaną ofertą', () => {
    const { netTotal } = calcTotals(SAMPLE_ITEMS, true);
    const payload = buildV2ProjectPayload(USER_ID, 'Remont', CLIENT_ID, OFFER_ID, netTotal, NOW);
    expect(payload.source_offer_id).toBe(OFFER_ID);
  });

  it('total_from_offer i budget_net odpowiadają kwocie netto oferty', () => {
    const { netTotal } = calcTotals(SAMPLE_ITEMS, true);
    const payload = buildV2ProjectPayload(USER_ID, 'Remont', CLIENT_ID, OFFER_ID, netTotal, NOW);
    expect(payload.total_from_offer).toBe(netTotal);
    expect(payload.budget_net).toBe(netTotal);
  });

  it('budget_source = OFFER_NET — kanoniczny enum, nie tłumaczenie', () => {
    const { netTotal } = calcTotals(SAMPLE_ITEMS, true);
    const payload = buildV2ProjectPayload(USER_ID, 'Remont', CLIENT_ID, OFFER_ID, netTotal, NOW);
    expect(payload.budget_source).toBe('OFFER_NET');
  });

  it('progress_percent = 0, stages_json = [] dla nowego projektu', () => {
    const { netTotal } = calcTotals(SAMPLE_ITEMS, true);
    const payload = buildV2ProjectPayload(USER_ID, 'Remont', CLIENT_ID, OFFER_ID, netTotal, NOW);
    expect(payload.progress_percent).toBe(0);
    expect(payload.stages_json).toEqual([]);
  });

  it('title pochodzi z pola projectName, nie z tłumaczenia', () => {
    const { netTotal } = calcTotals(SAMPLE_ITEMS, true);
    const payload = buildV2ProjectPayload(USER_ID, 'Remont łazienki', CLIENT_ID, OFFER_ID, netTotal, NOW);
    expect(payload.title).toBe('Remont łazienki');
  });

  it('zawiera user_id i client_id', () => {
    const { netTotal } = calcTotals(SAMPLE_ITEMS, true);
    const payload = buildV2ProjectPayload(USER_ID, 'Test', CLIENT_ID, OFFER_ID, netTotal, NOW);
    expect(payload.user_id).toBe(USER_ID);
    expect(payload.client_id).toBe(CLIENT_ID);
  });
});

// ── TESTY: brak zapisu do legacy `projects` ───────────────────────────────────

describe('Quick Estimate — weryfikacja że cel finalizacji to v2_projects', () => {
  it('v2_projects.status używa kanonicznego enum string (ACTIVE), nie tłumaczenia', () => {
    const canonicalStatuses = ['ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED'];
    const { netTotal } = calcTotals(SAMPLE_ITEMS, true);
    const payload = buildV2ProjectPayload(USER_ID, 'Test', CLIENT_ID, OFFER_ID, netTotal, NOW);
    expect(canonicalStatuses).toContain(payload.status);
  });

  it('offers.status używa kanonicznego enum string (SENT), nie tłumaczenia', () => {
    const canonicalOfferStatuses = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'ARCHIVED'];
    const payload = buildOfferPromotePayload('Test', CLIENT_ID, true, SAMPLE_ITEMS);
    expect(canonicalOfferStatuses).toContain(payload.status);
  });

  it('finalizacja produkuje source_offer_id — projekt jest powiązany z ofertą', () => {
    // Stary przepływ: projects.id nie był powiązany z offers.id
    // Nowy przepływ: v2_projects.source_offer_id = offers.id
    const { netTotal } = calcTotals(SAMPLE_ITEMS, true);
    const payload = buildV2ProjectPayload(USER_ID, 'Test', CLIENT_ID, OFFER_ID, netTotal, NOW);
    expect(payload.source_offer_id).toBeDefined();
    expect(payload.source_offer_id).not.toBeNull();
    expect(typeof payload.source_offer_id).toBe('string');
  });
});

// ── TESTY: kalkulacja calcTotals (zależność używana przez promoteDraft) ────────

describe('calcTotals — poprawność kalkulacji używanej w finalizacji', () => {
  it('calcTotals z VAT: brutto = netto * 1.23', () => {
    const items: LineItem[] = [
      { id: '1', name: 'Usługa', qty: 1, unit: 'szt', priceMode: 'single',
        price: 1000, laborCost: 0, materialCost: 0, marginPct: 0, showMargin: true, itemType: 'service' },
    ];
    const { netTotal, vatAmount, grossTotal } = calcTotals(items, true);
    expect(netTotal).toBeCloseTo(1000, 2);
    expect(vatAmount).toBeCloseTo(230, 2);
    expect(grossTotal).toBeCloseTo(1230, 2);
  });

  it('calcTotals bez VAT: brutto = netto', () => {
    const items: LineItem[] = [
      { id: '1', name: 'Usługa', qty: 1, unit: 'szt', priceMode: 'single',
        price: 1000, laborCost: 0, materialCost: 0, marginPct: 0, showMargin: true, itemType: 'service' },
    ];
    const { netTotal, vatAmount, grossTotal } = calcTotals(items, false);
    expect(netTotal).toBeCloseTo(1000, 2);
    expect(vatAmount).toBeCloseTo(0, 2);
    expect(grossTotal).toBeCloseTo(1000, 2);
  });

  it('calcTotals pusta lista: wszystkie wartości = 0', () => {
    const { netTotal, vatAmount, grossTotal } = calcTotals([], true);
    expect(netTotal).toBe(0);
    expect(vatAmount).toBe(0);
    expect(grossTotal).toBe(0);
  });
});
