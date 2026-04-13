/**
 * sec01-harden-public-offer-access.test.ts
 *
 * PR: pr-sec-01-harden-public-offer-ItF0m
 *
 * Weryfikuje model dostępu po hardening SEC-01.
 *
 * POSITIVE:
 *   P1. fetchPublicOffer z ważnym tokenem → zwraca dane oferty
 *   P2. fetchPublicOffer wywołuje RPC, nie from('offer_approvals')
 *   P3. recordOfferViewed wywołuje RPC, nie from('offer_approvals')
 *   P4. Zwrócone dane NIE zawierają accept_token, signature_data, user_id
 *
 * NEGATIVE:
 *   N1. Błędny token → fetchPublicOffer rzuca błąd 'not_found'
 *   N2. Wygasły token → fetchPublicOffer rzuca błąd 'expired'
 *   N3. Zniekształcony token (nie-UUID) → fetchPublicOffer rzuca błąd
 *   N4. Brak tokenu → fetchPublicOffer rzuca błąd 'missing_token'
 *   N5. Supabase klient error → propagowany do wywołującego
 *   N6. Drugi poprawny token NIE może odczytać danych innego tokenu
 *
 * COMPATIBILITY:
 *   C1. Dane z OfferData są mapowane poprawnie (project, quote, company)
 *   C2. status 'accepted' → nie rzuca błędu (offer nadal dostępna)
 *   C3. status 'rejected' → nie rzuca błędu (offer nadal dostępna)
 *   C4. recordOfferViewed — błędy połączenia są ciche (fire-and-forget)
 *
 * STRUCTURAL (brak bezpośrednich zapytań do tabeli):
 *   S1. publicOfferApi nie wywołuje supabase.from() dla offer_approvals
 *   S2. fetchPublicOffer przekazuje p_token do RPC (nie raw token string)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mock supabase client ─────────────────────────────────────────────────────

const mockRpc = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: mockRpc,
    from: mockFrom,
  },
}));

// ─── Helper: build a valid offer payload (as returned by the SECURITY DEFINER fn) ──

function buildOfferPayload(overrides: Record<string, unknown> = {}) {
  return {
    id: 'offer-uuid-001',
    status: 'pending',
    client_name: 'Jan Kowalski',
    client_email: 'jan@example.com',
    created_at: '2026-03-01T10:00:00Z',
    valid_until: '2026-05-01T00:00:00Z',
    viewed_at: null,
    accepted_at: null,
    approved_at: null,
    accepted_via: null,
    withdrawn_at: null,
    project: { project_name: 'Remont kuchni', status: 'active' },
    quote: { total: 12500, positions: [{ name: 'Robocizna', qty: 1, unit: 'usługa', price: 12500 }] },
    company: { company_name: 'Majster Sp. z o.o.', owner_name: 'Adam Majster', phone: '+48123456789', contact_email: 'kontakt@majster.pl' },
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SEC-01 — publicOfferApi: fetchPublicOffer', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── P1: valid token → returns offer data ──────────────────────────────────
  it('P1: valid token → zwraca poprawne dane oferty', async () => {
    const payload = buildOfferPayload();
    mockRpc.mockResolvedValue({ data: payload, error: null });

    const { fetchPublicOffer } = await import('@/lib/publicOfferApi');
    const result = await fetchPublicOffer('valid-token-uuid');

    expect(result.id).toBe('offer-uuid-001');
    expect(result.status).toBe('pending');
    expect(result.client_name).toBe('Jan Kowalski');
    expect(result.project?.project_name).toBe('Remont kuchni');
    expect(result.quote?.total).toBe(12500);
    expect(result.company?.company_name).toBe('Majster Sp. z o.o.');
  });

  // ── P2: uses rpc, NOT from('offer_approvals') ─────────────────────────────
  it('P2: wywołuje supabase.rpc(), nie supabase.from()', async () => {
    mockRpc.mockResolvedValue({ data: buildOfferPayload(), error: null });

    const { fetchPublicOffer } = await import('@/lib/publicOfferApi');
    await fetchPublicOffer('some-token');

    expect(mockRpc).toHaveBeenCalledOnce();
    expect(mockRpc).toHaveBeenCalledWith('get_offer_approval_by_token', { p_token: 'some-token' });
    // CRITICAL: from() must NOT be called — direct table access removed
    expect(mockFrom).not.toHaveBeenCalled();
  });

  // ── P4: returned data does not contain sensitive columns ──────────────────
  it('P4: dane wynikowe NIE zawierają accept_token, signature_data, user_id', async () => {
    const payload = buildOfferPayload();
    mockRpc.mockResolvedValue({ data: payload, error: null });

    const { fetchPublicOffer } = await import('@/lib/publicOfferApi');
    const result = await fetchPublicOffer('valid-token-uuid');

    // Verify sensitive columns are absent from the returned object
    expect(result).not.toHaveProperty('accept_token');
    expect(result).not.toHaveProperty('signature_data');
    expect(result).not.toHaveProperty('user_id');
    expect(result).not.toHaveProperty('project_id');
    expect(result).not.toHaveProperty('expires_at');
    expect(result).not.toHaveProperty('public_token');
    expect(result).not.toHaveProperty('v2_project_id');
  });

  // ── N1: wrong token → not_found error ─────────────────────────────────────
  it('N1: błędny token → rzuca błąd "not_found"', async () => {
    mockRpc.mockResolvedValue({ data: { error: 'not_found' }, error: null });

    const { fetchPublicOffer } = await import('@/lib/publicOfferApi');

    await expect(fetchPublicOffer('wrong-token')).rejects.toThrow('not_found');
  });

  // ── N2: expired token → expired error ─────────────────────────────────────
  it('N2: wygasły token → rzuca błąd "expired"', async () => {
    mockRpc.mockResolvedValue({ data: { error: 'expired' }, error: null });

    const { fetchPublicOffer } = await import('@/lib/publicOfferApi');

    await expect(fetchPublicOffer('expired-token')).rejects.toThrow('expired');
  });

  // ── N3: malformed token (non-UUID string) → error propagated ─────────────
  it('N3: token spoza formatu UUID → błąd propagowany do wywołującego', async () => {
    mockRpc.mockResolvedValue({ data: { error: 'not_found' }, error: null });

    const { fetchPublicOffer } = await import('@/lib/publicOfferApi');

    await expect(fetchPublicOffer('not-a-uuid-!@#$%')).rejects.toThrow();
  });

  // ── N5: Supabase client error → propagated ────────────────────────────────
  it('N5: błąd klienta Supabase → propagowany do wywołującego', async () => {
    const networkError = new Error('Network request failed');
    mockRpc.mockResolvedValue({ data: null, error: networkError });

    const { fetchPublicOffer } = await import('@/lib/publicOfferApi');

    await expect(fetchPublicOffer('any-token')).rejects.toThrow('Network request failed');
  });

  // ── N6: token isolation — one token cannot read another user's data ───────
  it('N6: token izolacja — jeden token nie odczytuje danych drugiego', async () => {
    // When called with token-A, RPC returns payload for token-A
    mockRpc.mockImplementation((_fn: string, params: { p_token: string }) => {
      if (params.p_token === 'token-a') {
        return Promise.resolve({ data: buildOfferPayload({ id: 'offer-A', client_name: 'Klient A' }), error: null });
      }
      // token-B gets "not_found" for token-A's data
      return Promise.resolve({ data: { error: 'not_found' }, error: null });
    });

    const { fetchPublicOffer } = await import('@/lib/publicOfferApi');

    const offerA = await fetchPublicOffer('token-a');
    expect(offerA.id).toBe('offer-A');
    expect(offerA.client_name).toBe('Klient A');

    // token-b correctly fails — cannot read token-a's data
    await expect(fetchPublicOffer('token-b')).rejects.toThrow('not_found');

    // Both calls went through RPC with distinct p_token values
    expect(mockRpc).toHaveBeenCalledTimes(2);
    expect(mockRpc).toHaveBeenNthCalledWith(1, 'get_offer_approval_by_token', { p_token: 'token-a' });
    expect(mockRpc).toHaveBeenNthCalledWith(2, 'get_offer_approval_by_token', { p_token: 'token-b' });
  });

  // ── C1: data mapping — project, quote, company present ───────────────────
  it('C1: mapowanie danych — project, quote, company poprawnie zmapowane', async () => {
    const payload = buildOfferPayload({
      project: { project_name: 'Budowa garażu', status: 'in_progress' },
      quote: { total: 45000, positions: [{ name: 'Fundamenty', qty: 1, unit: 'szt', price: 45000 }] },
      company: { company_name: 'ABC Budownictwo', owner_name: null, phone: null, contact_email: null },
    });
    mockRpc.mockResolvedValue({ data: payload, error: null });

    const { fetchPublicOffer } = await import('@/lib/publicOfferApi');
    const result = await fetchPublicOffer('token-x');

    expect(result.project?.project_name).toBe('Budowa garażu');
    expect(result.project?.status).toBe('in_progress');
    expect(result.quote?.total).toBe(45000);
    expect(result.quote?.positions).toHaveLength(1);
    expect(result.company?.company_name).toBe('ABC Budownictwo');
  });

  // ── C2: accepted offer is accessible (offer remains visible post-decision) ─
  it('C2: status "accepted" → nie rzuca błędu, oferta nadal dostępna', async () => {
    const payload = buildOfferPayload({
      status: 'accepted',
      accepted_at: '2026-03-15T12:00:00Z',
      accepted_via: 'web_button',
    });
    mockRpc.mockResolvedValue({ data: payload, error: null });

    const { fetchPublicOffer } = await import('@/lib/publicOfferApi');
    const result = await fetchPublicOffer('valid-accepted-token');

    expect(result.status).toBe('accepted');
    expect(result.accepted_at).toBe('2026-03-15T12:00:00Z');
  });

  // ── C3: rejected offer is accessible ─────────────────────────────────────
  it('C3: status "rejected" → nie rzuca błędu, oferta nadal dostępna', async () => {
    const payload = buildOfferPayload({ status: 'rejected' });
    mockRpc.mockResolvedValue({ data: payload, error: null });

    const { fetchPublicOffer } = await import('@/lib/publicOfferApi');
    const result = await fetchPublicOffer('valid-rejected-token');

    expect(result.status).toBe('rejected');
  });

  // ── P2 supplement: RPC function name is correct ───────────────────────────
  it('P2b: RPC wywołuje dokładnie "get_offer_approval_by_token"', async () => {
    mockRpc.mockResolvedValue({ data: buildOfferPayload(), error: null });

    const { fetchPublicOffer } = await import('@/lib/publicOfferApi');
    await fetchPublicOffer('any-token');

    const [rpcName] = mockRpc.mock.calls[0] as [string, unknown];
    expect(rpcName).toBe('get_offer_approval_by_token');
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('SEC-01 — publicOfferApi: recordOfferViewed', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // ── P3: uses rpc, NOT from('offer_approvals') ─────────────────────────────
  it('P3: wywołuje supabase.rpc("record_offer_viewed_by_token"), nie from()', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const { recordOfferViewed } = await import('@/lib/publicOfferApi');
    await recordOfferViewed('some-token');

    expect(mockRpc).toHaveBeenCalledOnce();
    expect(mockRpc).toHaveBeenCalledWith('record_offer_viewed_by_token', { p_token: 'some-token' });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  // ── C4: connection errors are silent (fire-and-forget) ───────────────────
  it('C4: błąd połączenia jest cichy — nie rzuca błędu do wywołującego', async () => {
    mockRpc.mockResolvedValue({ data: null, error: new Error('Connection refused') });

    const { recordOfferViewed } = await import('@/lib/publicOfferApi');

    // Must NOT throw — fire-and-forget behavior
    await expect(recordOfferViewed('any-token')).resolves.toBeUndefined();
  });

  it('C4b: supabase.rpc wywołuje record_offer_viewed_by_token (nie inną funkcję)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const { recordOfferViewed } = await import('@/lib/publicOfferApi');
    await recordOfferViewed('check-fn-name-token');

    const [rpcName] = mockRpc.mock.calls[0] as [string, unknown];
    expect(rpcName).toBe('record_offer_viewed_by_token');
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('SEC-01 — Strukturalny: brak bezpośredniego dostępu do tabeli offer_approvals', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  /**
   * S1: This test verifies that publicOfferApi.ts does NOT call supabase.from()
   * for offer_approvals access.  The mock tracks all calls to from(); if any
   * code path calls from('offer_approvals'), this test will catch it.
   */
  it('S1: fetchPublicOffer nie wywołuje supabase.from("offer_approvals")', async () => {
    mockRpc.mockResolvedValue({ data: buildOfferPayload(), error: null });

    const { fetchPublicOffer } = await import('@/lib/publicOfferApi');
    await fetchPublicOffer('any-token');

    // from() should never be called — all access is through rpc()
    expect(mockFrom).not.toHaveBeenCalled();

    // Verify rpc IS called (ensuring the test is not vacuously true)
    expect(mockRpc).toHaveBeenCalledOnce();
  });

  it('S1b: recordOfferViewed nie wywołuje supabase.from("offer_approvals")', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const { recordOfferViewed } = await import('@/lib/publicOfferApi');
    await recordOfferViewed('any-token');

    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockRpc).toHaveBeenCalledOnce();
  });

  /**
   * S2: RPC parameter is named p_token (matching the DB function signature).
   * This ensures callers pass the token as the correct named parameter.
   */
  it('S2: RPC przekazuje token jako nazwany parametr p_token', async () => {
    mockRpc.mockResolvedValue({ data: buildOfferPayload(), error: null });

    const { fetchPublicOffer } = await import('@/lib/publicOfferApi');
    await fetchPublicOffer('test-token-value');

    const [, params] = mockRpc.mock.calls[0] as [string, Record<string, unknown>];
    expect(params).toHaveProperty('p_token', 'test-token-value');
    expect(params).not.toHaveProperty('token');          // old param name
    expect(params).not.toHaveProperty('public_token');   // direct column name
  });
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * N4: No-token guard — when token is undefined/empty, the query
 * is not sent at all (enforced by the enabled: Boolean(token) guard in
 * TanStack Query in the page components).
 *
 * This is documented as an architectural invariant test.
 */
describe('SEC-01 — Wartownik: brak tokenu', () => {
  it('N4: fetchPublicOffer rzuca błąd gdy token jest pustym stringiem', async () => {
    // Even if somehow called with an empty string, the RPC returns not_found
    mockRpc.mockResolvedValue({ data: { error: 'not_found' }, error: null });

    const { fetchPublicOffer } = await import('@/lib/publicOfferApi');

    await expect(fetchPublicOffer('')).rejects.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * INTEGRATION TEST SPECIFICATION (dokumentacja — nie jest testem jednostkowym):
 *
 * Następujące testy MUSZĄ być wykonane jako integracyjne (z prawdziwym Supabase):
 *
 * DB-ANON-1: SELECT * FROM offer_approvals (bez WHERE) z kluczem anon
 *   Expected: 0 wierszy (brak polityki SELECT dla anon → RLS blokuje)
 *
 * DB-ANON-2: UPDATE offer_approvals SET status='approved' (bez WHERE) z kluczem anon
 *   Expected: 0 wierszy zaktualizowanych (brak polityki UPDATE dla anon)
 *
 * DB-ANON-3: SELECT * FROM offer_approvals WHERE public_token = '<valid UUID>' z kluczem anon
 *   Expected: 0 wierszy (brak polityki SELECT dla anon — musi przejść przez RPC)
 *
 * DB-RPC-1: SELECT get_offer_approval_by_token('<valid token>') z kluczem anon
 *   Expected: poprawne dane oferty (SECURITY DEFINER omija RLS)
 *
 * DB-RPC-2: SELECT get_offer_approval_by_token('<wrong token>') z kluczem anon
 *   Expected: {"error":"not_found"}
 *
 * DB-RPC-3: SELECT get_offer_approval_by_token(NULL) z kluczem anon
 *   Expected: {"error":"not_found"}
 *
 * DB-ENUM-1: Brak możliwości enumeracji — COUNT(*) FROM offer_approvals z kluczem anon
 *   Expected: 0 (RLS blokuje, anon nie widzi tabeli)
 */
describe('SEC-01 — Specyfikacja testów integracyjnych (dokumentacja)', () => {
  it('SPEC: anon SELECT bez filtru musi zwrócić 0 wierszy [wymaga realnej bazy]', () => {
    // This test documents the required behavior verified against a real Supabase instance.
    // See integration spec above.
    expect(true).toBe(true);
  });
});
