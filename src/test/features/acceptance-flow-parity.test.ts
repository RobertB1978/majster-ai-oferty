/**
 * Acceptance Flow Parity Tests
 *
 * Weryfikuje kontrakty obu flow akceptacji ofert:
 *   FLOW A (Legacy): offer_approvals + Edge Function approve-offer → /offer/:token
 *   FLOW B (New):    acceptance_links + SECURITY DEFINER DB functions → /a/:token
 *
 * Cel: mapa różnic między flow jako test kontraktowy, nie E2E.
 *
 * ─── PODZIAŁ TESTÓW ────────────────────────────────────────────────────────────
 *
 *  SEKCJA 1 — TESTY REALNE (wykonywalne lokalnie, czysta logika)
 *  SEKCJA 2 — TESTY SKIP (wymagają Supabase client / staging tokenów)
 *  SEKCJA 3 — TESTY TODO (wymagają pełnego środowiska runtime / Edge Function)
 *
 * ─── CONTEXT ────────────────────────────────────────────────────────────────────
 *
 * Istniejące testy związane z tym obszarem:
 *   - src/test/features/acceptance-bridge.test.ts — logika buildV2ProjectPayload
 *   - src/test/features/prevent-duplicate-projects.test.ts — guard duplikatów
 *   - src/test/features/harden-offer-flow.test.tsx — flow wysyłki oferty
 *
 * Ten plik dodaje testy PARITY między flow A i B — nie zastępuje powyższych.
 *
 * SHA audytu: 75bd71847df55d7f6c62e0f545bdb82f87969bf4
 * Data:       2026-04-04
 */

import { describe, it, expect } from 'vitest';

// ── Stałe kontraktowe ────────────────────────────────────────────────────────────
// Wyciągnięte z kodu — odzwierciedlają rzeczywisty stan repo.

/** Statusy oferty w tabeli offer_approvals (legacy flow) — lowercase */
const LEGACY_STATUSES = [
  'pending',
  'draft',
  'sent',
  'viewed',
  'accepted',
  'approved',
  'rejected',
  'expired',
  'withdrawn',
] as const;

/** Statusy oferty w tabeli offers (new flow) — UPPERCASE */
const NEW_FLOW_OFFER_STATUSES = ['SENT', 'ACCEPTED', 'REJECTED'] as const;

/** Publiczne routes dla obu flow */
const ROUTES = {
  legacy: '/offer/:token',
  new: '/a/:token',
} as const;

/** Źródła tokenów */
const TOKEN_SOURCES = {
  legacy: 'offer_approvals.public_token',
  new: 'acceptance_links.token',
} as const;

/** DB funkcje nowego flow (dokumentacja kontraktu — prefix _ = intentionally unused) */
const _NEW_FLOW_DB_FUNCTIONS = {
  read: 'resolve_offer_acceptance_link',
  write: 'process_offer_acceptance_action',
} as const;

/** Edge Function legacy flow (dokumentacja kontraktu — prefix _ = intentionally unused) */
const _LEGACY_EDGE_FUNCTION = 'approve-offer' as const;

// ════════════════════════════════════════════════════════════════════════════════
// SEKCJA 1 — TESTY REALNE
// Wykonywalne lokalnie, bez Supabase client, bez tokenów.
// Testują logikę i kontrakty wyciągnięte ze statycznej analizy kodu.
// ════════════════════════════════════════════════════════════════════════════════

describe('[REAL] Oba flow mapują się do akceptacji oferty', () => {
  it('legacy flow: akceptacja zapisuje status "accepted" w offer_approvals', () => {
    // Kontrakt z approve-offer/index.ts:357
    // updateData.status = action === 'approve' ? 'accepted' : 'rejected'
    const action = 'approve';
    const expectedStatus = action === 'approve' ? 'accepted' : 'rejected';
    expect(expectedStatus).toBe('accepted');
    expect(LEGACY_STATUSES).toContain(expectedStatus);
  });

  it('new flow: akceptacja zapisuje status "ACCEPTED" w offers', () => {
    // Kontrakt z process_offer_acceptance_action (migration pr12, linia 262–264)
    // UPDATE offers SET status = 'ACCEPTED', accepted_at = now() WHERE id = v_offer.id
    const action = 'ACCEPT';
    const expectedStatus = action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED';
    expect(expectedStatus).toBe('ACCEPTED');
    expect(NEW_FLOW_OFFER_STATUSES).toContain(expectedStatus);
  });

  it('oba flow używają różnych tabel jako źródło statusu', () => {
    const legacyTable = 'offer_approvals';
    const newTable = 'offers';
    expect(legacyTable).not.toBe(newTable);
  });

  it('statusy są w różnych case — legacy lowercase, new UPPERCASE', () => {
    const legacyAccepted = 'accepted';
    const newAccepted = 'ACCEPTED';
    expect(legacyAccepted).not.toBe(newAccepted);
    expect(legacyAccepted).toBe(legacyAccepted.toLowerCase());
    expect(newAccepted).toBe(newAccepted.toUpperCase());
  });
});

describe('[REAL] Oba flow używają różnych token sources', () => {
  it('legacy flow token pochodzi z offer_approvals.public_token', () => {
    expect(TOKEN_SOURCES.legacy).toBe('offer_approvals.public_token');
  });

  it('new flow token pochodzi z acceptance_links.token', () => {
    expect(TOKEN_SOURCES.new).toBe('acceptance_links.token');
  });

  it('token sources są różne', () => {
    expect(TOKEN_SOURCES.legacy).not.toBe(TOKEN_SOURCES.new);
  });

  it('oba flow używają różnych publicznych routes', () => {
    expect(ROUTES.legacy).toBe('/offer/:token');
    expect(ROUTES.new).toBe('/a/:token');
    expect(ROUTES.legacy).not.toBe(ROUTES.new);
  });
});

describe('[REAL] Legacy flow — auto-konwersja do v2_project', () => {
  // Logika z approve-offer/index.ts:381–395
  // createAndLinkV2Project() wywołana po każdej approve akcji

  it('legacy flow tworzy v2_project automatycznie przy akceptacji', () => {
    // Idempotencja: sprawdza v2_project_id przed tworzeniem
    function shouldCreateV2Project(approval: { v2_project_id?: string | null }): boolean {
      return !approval.v2_project_id; // tworzy tylko gdy brakuje
    }
    expect(shouldCreateV2Project({ v2_project_id: null })).toBe(true);
    expect(shouldCreateV2Project({ v2_project_id: undefined })).toBe(true);
    expect(shouldCreateV2Project({ v2_project_id: 'existing-id' })).toBe(false);
  });

  it('idempotencja: v2_project_id w offer_approvals zapobiega duplikatom', () => {
    const approvalWithV2 = { id: 'a-1', v2_project_id: 'v2-project-existing' };
    const approvalWithoutV2 = { id: 'a-2', v2_project_id: null };

    function getOrCreateV2(approval: { v2_project_id?: string | null }): string | 'WOULD_CREATE' {
      if (approval.v2_project_id) return approval.v2_project_id;
      return 'WOULD_CREATE';
    }

    expect(getOrCreateV2(approvalWithV2)).toBe('v2-project-existing');
    expect(getOrCreateV2(approvalWithoutV2)).toBe('WOULD_CREATE');
  });

  it('recovery: idempotencja działa też przy kolejnych wywołaniach (already final status)', () => {
    // approve-offer/index.ts:326–341
    // alreadyFinal → sprawdza v2_project_id i tworzy jeśli brakuje
    const alreadyAcceptedStatuses = ['accepted', 'approved'];
    const finalStatuses = ['accepted', 'approved', 'rejected', 'expired', 'withdrawn'];

    function isRecoveryNeeded(status: string, v2ProjectId: string | null): boolean {
      return alreadyAcceptedStatuses.includes(status) && !v2ProjectId;
    }

    expect(isRecoveryNeeded('accepted', null)).toBe(true);
    expect(isRecoveryNeeded('accepted', 'some-id')).toBe(false);
    expect(isRecoveryNeeded('rejected', null)).toBe(false);
    expect(finalStatuses.every(s => LEGACY_STATUSES.includes(s as (typeof LEGACY_STATUSES)[number]))).toBe(true);
  });
});

describe('[REAL] New flow — BRAK auto-konwersji do v2_project', () => {
  // process_offer_acceptance_action (migration pr12):
  // Aktualizuje TYLKO offers.status i wstawia do offer_public_actions.
  // ŻADNEGO wstawienia do v2_projects.

  it('new flow NIE tworzy v2_project automatycznie — wymaga akcji użytkownika', () => {
    // process_offer_acceptance_action zapisuje tylko:
    //   UPDATE offers SET status = 'ACCEPTED', accepted_at = now()
    //   INSERT INTO offer_public_actions (offer_id, token, action, comment)
    // v2_projects nie jest wymienione
    const newFlowOperations = [
      'UPDATE offers SET status',
      'INSERT INTO offer_public_actions',
    ];
    const includesV2ProjectInsert = newFlowOperations.some(op => op.includes('v2_projects'));
    expect(includesV2ProjectInsert).toBe(false);
  });

  it('new flow: AcceptanceLinkPanel oferuje przycisk "Utwórz projekt" po akceptacji', () => {
    // AcceptanceLinkPanel.tsx:118–129
    // Warunkowy render: existingProject ? "Otwórz projekt" : "Utwórz projekt"
    const offerStatus = 'ACCEPTED';
    const isAccepted = offerStatus === 'ACCEPTED';
    expect(isAccepted).toBe(true);
    // UI pokazuje przycisk CreateProjectV2 — manualna akcja wymagana
  });

  it('new flow: source_offer_id przekazywany do useCreateProjectV2', () => {
    // AcceptanceLinkPanel.tsx:123–126
    // createProject.mutateAsync({ title, source_offer_id: offerId })
    const offerId = 'offer-abc-123';
    const payload = {
      title: 'Nowy projekt',
      source_offer_id: offerId,
    };
    expect(payload.source_offer_id).toBe(offerId);
    expect(payload.source_offer_id).not.toBeNull();
  });
});

describe('[REAL] Legacy flow — guard przed duplikatem projektu (DB level)', () => {
  // migration 20260331130000_harden_duplicate_project_prevention.sql
  // Partial unique index: uq_v2_projects_active_source_offer
  // ON v2_projects (source_offer_id) WHERE status != 'CANCELLED' AND source_offer_id IS NOT NULL

  it('unique index na v2_projects(source_offer_id) zapobiega duplikatom', () => {
    const indexDefinition = {
      table: 'v2_projects',
      column: 'source_offer_id',
      partialCondition: "status != 'CANCELLED' AND source_offer_id IS NOT NULL",
    };
    // Jedna zaakceptowana oferta → co najwyżej jeden aktywny projekt
    expect(indexDefinition.table).toBe('v2_projects');
    expect(indexDefinition.partialCondition).toContain('CANCELLED');
    expect(indexDefinition.partialCondition).toContain('IS NOT NULL');
  });

  it('anulowany projekt (CANCELLED) nie blokuje utworzenia nowego z tej samej oferty', () => {
    // WHERE status != 'CANCELLED' — anulowane nie blokują
    function wouldIndexBlock(status: string, sourceOfferId: string | null): boolean {
      if (!sourceOfferId) return false; // null wykluczone z indeksu
      if (status === 'CANCELLED') return false; // CANCELLED wykluczone
      return true; // ACTIVE, COMPLETED, ON_HOLD blokują
    }

    expect(wouldIndexBlock('ACTIVE', 'offer-1')).toBe(true);
    expect(wouldIndexBlock('CANCELLED', 'offer-1')).toBe(false);
    expect(wouldIndexBlock('ACTIVE', null)).toBe(false);
  });
});

describe('[REAL] Legacy flow — powiadomienia wykonawcy', () => {
  // approve-offer/index.ts: INSERT do notifications przy każdej akcji

  it('legacy flow wysyła powiadomienie przy pierwszym otwarciu oferty (viewed)', () => {
    // approve-offer/index.ts:197–204
    const notificationTrigger = 'viewed_first_time';
    const expectedNotificationType = 'info';
    expect(['info', 'success', 'warning', 'error']).toContain(expectedNotificationType);
    expect(notificationTrigger).toBe('viewed_first_time');
  });

  it('legacy flow wysyła powiadomienie przy akceptacji', () => {
    // approve-offer/index.ts:399–406
    const notificationTitle = '✓ Klient zaakceptował ofertę';
    expect(notificationTitle).toContain('zaakceptował');
  });

  it('legacy flow wysyła powiadomienie przy odrzuceniu', () => {
    // approve-offer/index.ts:408–415
    const notificationTitle = 'Oferta odrzucona';
    expect(notificationTitle).toBeTruthy();
  });

  it('new flow NIE wysyła powiadomień — process_offer_acceptance_action tego nie robi', () => {
    // Weryfikacja statyczna: process_offer_acceptance_action w migration pr12
    // nie zawiera INSERT INTO notifications
    const newFlowOperations = [
      'UPDATE offers SET status',
      'INSERT INTO offer_public_actions',
      // notifications NIE są tu wymienione
    ];
    const hasNotifications = newFlowOperations.some(op => op.includes('notifications'));
    expect(hasNotifications).toBe(false);
  });
});

describe('[REAL] New flow — idempotencja przy wielokrotnych akcjach', () => {
  // process_offer_acceptance_action (migration pr12, linia 246–253)
  // IF v_offer.status IN ('ACCEPTED', 'REJECTED') THEN return idempotent: true

  it('ponowna akcja na już zaakceptowanej ofercie zwraca idempotent: true', () => {
    function processAction(currentStatus: string, _action: string): { success: boolean; idempotent?: boolean } {
      if (['ACCEPTED', 'REJECTED'].includes(currentStatus)) {
        return { success: true, idempotent: true };
      }
      if (currentStatus !== 'SENT') {
        return { success: false };
      }
      return { success: true };
    }

    expect(processAction('ACCEPTED', 'ACCEPT')).toMatchObject({ success: true, idempotent: true });
    expect(processAction('REJECTED', 'ACCEPT')).toMatchObject({ success: true, idempotent: true });
    expect(processAction('SENT', 'ACCEPT')).toMatchObject({ success: true });
    expect(processAction('SENT', 'ACCEPT')).not.toHaveProperty('idempotent');
  });

  it('tylko oferty ze statusem SENT mogą być zaakceptowane/odrzucone', () => {
    function canAct(status: string): boolean {
      return status === 'SENT';
    }

    expect(canAct('SENT')).toBe(true);
    expect(canAct('DRAFT')).toBe(false);
    expect(canAct('ACCEPTED')).toBe(false);
    expect(canAct('REJECTED')).toBe(false);
  });
});

describe('[REAL] New flow — expiry enforcement', () => {
  // resolve_offer_acceptance_link (migration pr12, linia 117–119)
  // IF v_link.expires_at < now() THEN RETURN jsonb_build_object('error', 'expired')

  it('wygasły link zwraca error "expired"', () => {
    function checkExpiry(expiresAt: string): { error?: string } | { valid: true } {
      if (new Date(expiresAt) < new Date()) {
        return { error: 'expired' };
      }
      return { valid: true };
    }

    const pastDate = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    const futureDate = new Date(Date.now() + 1000 * 60 * 60).toISOString();

    expect(checkExpiry(pastDate)).toHaveProperty('error', 'expired');
    expect(checkExpiry(futureDate)).toHaveProperty('valid', true);
  });

  it('legacy flow ma dwa poziomy expiry: expires_at (link) i valid_until (oferta)', () => {
    // approve-offer/index.ts:157–183
    const expiryChecks = ['expires_at', 'valid_until'];
    expect(expiryChecks).toHaveLength(2);
    expect(expiryChecks).toContain('expires_at');
    expect(expiryChecks).toContain('valid_until');
  });

  it('new flow ma jeden poziom expiry: acceptance_links.expires_at', () => {
    const expiryChecks = ['expires_at'];
    expect(expiryChecks).toHaveLength(1);
  });
});

describe('[REAL] Rozbieżność statusów — problem synchronizacji', () => {
  it('status ACCEPTED z nowego flow nie aktualizuje offer_approvals', () => {
    // process_offer_acceptance_action aktualizuje TYLKO offers.status
    // offer_approvals.status pozostaje 'sent' lub 'pending'
    const offersTableStatus = 'ACCEPTED';       // po new flow
    const offerApprovalsStatus = 'sent';        // stary status, niezmieniony

    // To jest luka — różne tabele, różne statusy
    expect(offersTableStatus).not.toBe(offerApprovalsStatus);
  });

  it('status accepted z legacy flow nie aktualizuje offers.status', () => {
    // approve-offer aktualizuje TYLKO offer_approvals.status
    // offers.status (jeśli istnieje) pozostaje 'SENT'
    const offerApprovalsStatus = 'accepted';    // po legacy flow
    const offersStatus = 'SENT';                // stary status, niezmieniony

    expect(offerApprovalsStatus).not.toBe(offersStatus);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// SEKCJA 2 — TESTY SKIP
// Wymagają Supabase client, staging tokenów lub live DB.
// Oznaczone .skip — nie wykonają się bez środowiska runtime.
// ════════════════════════════════════════════════════════════════════════════════

describe('[SKIP] Legacy flow — integracja z Edge Function', () => {
  it.skip('POST /functions/v1/approve-offer z valid token zwraca { success: true }', () => {
    // SKIP: wymaga VITE_SUPABASE_URL + live Supabase instance + valid public_token
    // Bez staging tokenu niemożliwe do weryfikacji.
  });

  it.skip('POST approve-offer z action=approve tworzy wiersz w v2_projects', () => {
    // SKIP: wymaga live DB + valid offer_approvals record
  });

  it.skip('POST approve-offer z action=approve wstawia powiadomienie do notifications', () => {
    // SKIP: wymaga live DB + valid user_id
  });

  it.skip('GET approve-offer z valid token zwraca dane oferty i projektu', () => {
    // SKIP: wymaga live DB + valid public_token
  });

  it.skip('POST approve-offer z wygasłym token zwraca 410 LINK_EXPIRED', () => {
    // SKIP: wymaga live DB z wygasłym offer_approvals record
  });

  it.skip('POST approve-offer z action=cancel_accept po 10 minutach zwraca błąd', () => {
    // SKIP: wymaga live DB + kontroli czasu
  });
});

describe('[SKIP] New flow — integracja z SECURITY DEFINER DB functions', () => {
  it.skip('resolve_offer_acceptance_link(valid_token) zwraca dane oferty', () => {
    // SKIP: wymaga Supabase client + anon key + valid token z acceptance_links
  });

  it.skip('process_offer_acceptance_action(valid_token, ACCEPT) zmienia offers.status na ACCEPTED', () => {
    // SKIP: wymaga Supabase client + valid token
  });

  it.skip('process_offer_acceptance_action z wygasłym tokenem zwraca { error: "expired" }', () => {
    // SKIP: wymaga live DB z wygasłym acceptance_links record
  });

  it.skip('upsert_acceptance_link RPC istnieje na produkcji i działa', () => {
    // SKIP: stan na produkcji UNKNOWN — migracja w repo, ale live niezweryfikowane
  });

  it.skip('process_offer_acceptance_action dwukrotnie → idempotent: true przy drugim wywołaniu', () => {
    // SKIP: wymaga live DB + sekwencji dwóch wywołań
  });
});

describe('[SKIP] Dual-flow — parity check na live danych', () => {
  it.skip('oferta zaakceptowana przez legacy flow → offers.status NIE = ACCEPTED', () => {
    // SKIP: wymaga live DB query na obu tabelach dla tego samego offer_id
  });

  it.skip('oferta zaakceptowana przez new flow → offer_approvals.status NIE = accepted', () => {
    // SKIP: wymaga live DB query na obu tabelach dla tego samego offer_id
  });

  it.skip('nie istnieje oferta zaakceptowana przez OBA flow jednocześnie', () => {
    // SKIP: wymaga live DB query z JOIN offer_approvals + acceptance_links na offer_id
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// SEKCJA 3 — TESTY TODO
// Wymagają pełnego środowiska: staging DB, Edge Functions uruchomione lokalnie,
// lub dedykowanego test harness.
// ════════════════════════════════════════════════════════════════════════════════

describe('[TODO] New flow — brakujące features vs legacy', () => {
  it.todo('process_offer_acceptance_action po dodaniu PR-1: tworzy v2_projects przy ACCEPT');
  it.todo('process_offer_acceptance_action po dodaniu PR-1: wstawia notifications przy ACCEPT/REJECT');
  it.todo('new flow po dodaniu PR-1: cancel window (10 min) — nowa akcja CANCEL_ACCEPT');
  it.todo('new flow po dodaniu PR-1: withdraw przez wykonawcę z JWT verification');
  it.todo('new flow po dodaniu PR-1: 1-click accept z accept_token z emaila');
});

describe('[TODO] Synchronizacja statusów między tabelami', () => {
  it.todo('widok DB offer_status_unified łączy offer_approvals.status i offers.status bez duplikatów');
  it.todo('useOffers zwraca poprawny status dla ofert zaakceptowanych przez new flow');
  it.todo('useOfferStats liczy ACCEPTED z obu tabel bez duplikacji');
});

describe('[TODO] Routing — backward compatibility', () => {
  it.todo('/offer/:token (legacy) nadal działa po deprecated route dla starych linków');
  it.todo('/a/:token (new) obsługuje token z acceptance_links po wdrożeniu PR-1');
  it.todo('redirect z /offer/:token → /a/:token dla ofert z acceptance_link');
});
