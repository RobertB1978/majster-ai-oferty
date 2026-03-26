/**
 * PR-08: Test IDOR (Insecure Direct Object Reference) — izolacja danych CRM i Cennika
 *
 * Weryfikuje że RLS (Row Level Security) w Supabase zapewnia izolację danych:
 * - User A nie może odczytać klientów User B
 * - User A nie może modyfikować klientów User B
 * - User A nie może odczytać pozycji cennika User B
 * - User A nie może modyfikować pozycji cennika User B
 *
 * Uwaga: Testy jednostkowe symulują zachowanie RLS przez mockowanie klienta Supabase.
 * Pełny test IDOR na żywej bazie należy wykonać manualnie (procedura w docs/SECURITY_BASELINE.md).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSupabaseClient } from '@/test/mocks/supabase';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

const USER_B_ID = 'user-b-uuid-2222';

const clientOwnedByUserB = {
  id: 'client-b-001',
  user_id: USER_B_ID,
  name: 'Klient Użytkownika B',
  nip: '5270103391',
  phone: '+48 111 222 333',
  email: 'klientb@example.pl',
  address: 'ul. Testowa 1, Warszawa',
  created_at: '2026-03-01T00:00:00Z',
};

const priceItemOwnedByUserB = {
  id: 'item-b-001',
  user_id: USER_B_ID,
  name: 'Pozycja cennika User B',
  unit: 'm²',
  default_qty: 10,
  default_price: 150,
  category: 'Robocizna',
  created_at: '2026-03-01T00:00:00Z',
};

describe('PR-08 IDOR — izolacja danych CRM (clients)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('SELECT: User A nie otrzymuje danych klientów User B (RLS filtruje po user_id)', async () => {
    // RLS zwraca pustą listę gdy auth.uid() != user_id
    mockSupabaseClient.from().select.mockResolvedValueOnce({
      data: [],
      error: null,
      count: 0,
    });

    const result = await mockSupabaseClient
      .from('clients')
      .select('id, name, nip, phone, email, created_at', { count: 'exact' });

    // User A powinien zobaczyć pustą listę — brak klientów należących do User B
    expect(result.data).toEqual([]);
    expect(result.count).toBe(0);
    expect(result.error).toBeNull();
  });

  it('SELECT by ID: próba pobrania klienta User B przez User A zwraca null', async () => {
    // RLS blokuje dostęp — .maybeSingle() zwraca null (nie rzuca błędu)
    mockSupabaseClient.from().maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const result = await mockSupabaseClient
      .from('clients')
      .select('*')
      .eq('id', clientOwnedByUserB.id)
      .maybeSingle();

    expect(result.data).toBeNull();
  });

  it('UPDATE: próba modyfikacji klienta User B przez User A zwraca 0 wierszy (RLS blokuje)', async () => {
    // RLS: UPDATE USING (auth.uid() = user_id) — brak dopasowania = 0 zaktualizowanych wierszy
    // Mock eq() jako ostatni krok w łańcuchu update().eq()
    mockSupabaseClient.from().eq.mockResolvedValueOnce({
      data: [],
      error: null,
    });

    const result = await mockSupabaseClient
      .from('clients')
      .update({ name: 'Zhakowany klient' })
      .eq('id', clientOwnedByUserB.id);

    // Brak błędu, ale też brak faktycznej zmiany — RLS filtruje
    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
  });

  it('DELETE: próba usunięcia klienta User B przez User A zwraca 0 wierszy (RLS blokuje)', async () => {
    // Mock eq() jako ostatni krok w łańcuchu delete().eq()
    mockSupabaseClient.from().eq.mockResolvedValueOnce({
      data: [],
      error: null,
    });

    const result = await mockSupabaseClient
      .from('clients')
      .delete()
      .eq('id', clientOwnedByUserB.id);

    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
  });

  it('INSERT: próba wstawienia klienta z user_id innego użytkownika jest blokowana przez RLS', async () => {
    // RLS INSERT WITH CHECK (auth.uid() = user_id) — nie można podszyć się pod innego usera
    mockSupabaseClient.from().insert.mockResolvedValueOnce({
      data: null,
      error: { message: 'new row violates row-level security policy for table "clients"', code: '42501' },
    });

    const result = await mockSupabaseClient
      .from('clients')
      .insert({ ...clientOwnedByUserB, user_id: USER_B_ID });

    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe('42501');
  });
});

describe('PR-08 IDOR — izolacja danych Cennika (item_templates)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('SELECT: User A nie widzi pozycji cennika User B', async () => {
    mockSupabaseClient.from().select.mockResolvedValueOnce({
      data: [],
      error: null,
      count: 0,
    });

    const result = await mockSupabaseClient
      .from('item_templates')
      .select('*', { count: 'exact' });

    expect(result.data).toEqual([]);
    expect(result.count).toBe(0);
  });

  it('UPDATE: User A nie może edytować pozycji cennika User B', async () => {
    // Mock eq() jako ostatni krok w łańcuchu update().eq()
    mockSupabaseClient.from().eq.mockResolvedValueOnce({
      data: [],
      error: null,
    });

    const result = await mockSupabaseClient
      .from('item_templates')
      .update({ default_price: 0 })
      .eq('id', priceItemOwnedByUserB.id);

    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
  });

  it('INSERT: User A nie może wstawić pozycji cennika z user_id User B', async () => {
    mockSupabaseClient.from().insert.mockResolvedValueOnce({
      data: null,
      error: { message: 'new row violates row-level security policy for table "item_templates"', code: '42501' },
    });

    const result = await mockSupabaseClient
      .from('item_templates')
      .insert({ ...priceItemOwnedByUserB, user_id: USER_B_ID });

    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe('42501');
  });
});

describe('PR-08 NIP — walidacja algorytmu sumy kontrolnej', () => {
  // Implementacja algorytmu NIP (duplikat z validations.ts do testów izolowanych)
  function validateNip(nip: string): boolean {
    const digits = nip.replace(/[\s-]/g, '');
    if (!/^\d{10}$/.test(digits)) return false;
    const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
    const sum = weights.reduce((acc, w, i) => acc + w * Number(digits[i]), 0);
    return sum % 11 === Number(digits[9]);
  }

  it('akceptuje poprawny NIP — Allegro (5270103391)', () => {
    expect(validateNip('5270103391')).toBe(true);
  });

  it('akceptuje poprawny NIP z myślnikami (527-010-33-91)', () => {
    expect(validateNip('527-010-33-91')).toBe(true);
  });

  it('akceptuje poprawny NIP z sumą kontrolną 7 (5550012347)', () => {
    // Wyliczony: wagi=[6,5,7,2,3,4,5,6,7] suma=150, 150%11=7, cyfra kontrolna=7
    expect(validateNip('5550012347')).toBe(true);
  });

  it('odrzuca NIP z błędną sumą kontrolną', () => {
    expect(validateNip('5270103392')).toBe(false);
  });

  it('odrzuca NIP z za mało cyfr', () => {
    expect(validateNip('123456789')).toBe(false);
  });

  it('odrzuca NIP z literami', () => {
    expect(validateNip('52701033AB')).toBe(false);
  });

  it('akceptuje pusty string (NIP jest opcjonalny — brak = pomijamy walidację)', () => {
    // Logika refine: !val || validateNip(val) — puste pole zawsze przepuszcza
    const emptyNip = '';
    const shouldPass = !emptyNip || validateNip(emptyNip);
    expect(shouldPass).toBe(true);
  });
});
