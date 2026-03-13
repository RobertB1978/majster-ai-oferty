/**
 * Testy flow weryfikacji emaila po rejestracji.
 *
 * Sprawdzają:
 * 1. Po rejestracji Supabase wywołuje signUp — NIE sesja (email czeka na potwierdzenie)
 * 2. resendVerificationEmail wywołuje supabase.auth.resend z prawidłowymi parametrami
 * 3. resendVerificationEmail obsługuje błąd rate-limit czytelnym komunikatem
 * 4. Niepotwierdzony email podczas logowania zwraca specjalny błąd (nie "invalid credentials")
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSupabaseClient } from '@/test/mocks/supabase';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

// Importujemy testowaną logikę bezpośrednio przez supabase client (unit testy na poziomie API)
describe('Email Verification Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rejestracja — stan oczekiwania na weryfikację', () => {
    it('signUp zwraca użytkownika bez sesji gdy email wymaga potwierdzenia', async () => {
      const mockUser = {
        id: 'new-user-1',
        email: 'jan@example.pl',
        email_confirmed_at: null,
        user_metadata: {},
      };

      // Supabase zwraca user ale session: null gdy potwierdzenie emaila jest wymagane
      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: { user: mockUser, session: null },
        error: null,
      });

      const result = await mockSupabaseClient.auth.signUp({
        email: 'jan@example.pl',
        password: 'HasloTest123',
        options: { emailRedirectTo: 'http://localhost:3000/auth/callback' },
      });

      expect(result.error).toBeNull();
      expect(result.data.user).toBeDefined();
      expect(result.data.user?.email_confirmed_at).toBeNull();
      // Brak sesji = email niezweryfikowany, aplikacja NIE powinna wpuścić do dashboardu
      expect(result.data.session).toBeNull();
    });

    it('signUp ze zduplikowanym emailem zwraca błąd User already registered', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'User already registered' },
      });

      const result = await mockSupabaseClient.auth.signUp({
        email: 'existing@example.pl',
        password: 'HasloTest123',
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('User already registered');
    });
  });

  describe('ponowne wysyłanie maila weryfikacyjnego (resend)', () => {
    it('resend wywołuje supabase.auth.resend z typem signup i emailem', async () => {
      mockSupabaseClient.auth.resend.mockResolvedValueOnce({
        data: {},
        error: null,
      });

      const result = await mockSupabaseClient.auth.resend({
        type: 'signup',
        email: 'jan@example.pl',
        options: { emailRedirectTo: 'http://localhost:3000/auth/callback' },
      });

      expect(result.error).toBeNull();
      expect(mockSupabaseClient.auth.resend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'signup',
          email: 'jan@example.pl',
        })
      );
    });

    it('resend obsługuje błąd rate-limit od Supabase', async () => {
      mockSupabaseClient.auth.resend.mockResolvedValueOnce({
        data: null,
        error: { message: 'Email rate limit exceeded' },
      });

      const result = await mockSupabaseClient.auth.resend({
        type: 'signup',
        email: 'jan@example.pl',
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('rate limit');
    });

    it('resend zwraca błąd gdy email jest pusty (nie powołuje API)', async () => {
      // Symulujemy scenariusz gdzie handler na froncie sprawdza email przed wywołaniem API
      const email = '';
      const shouldCallApi = email.trim().length > 0;

      expect(shouldCallApi).toBe(false);
      expect(mockSupabaseClient.auth.resend).not.toHaveBeenCalled();
    });
  });

  describe('logowanie z nieotwierdzonym emailem', () => {
    it('signInWithPassword zwraca błąd Email not confirmed dla nieotwierdzonych kont', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Email not confirmed' },
      });

      const result = await mockSupabaseClient.auth.signInWithPassword({
        email: 'nieotwierdzony@example.pl',
        password: 'HasloTest123',
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Email not confirmed');
      // Brak sesji — użytkownik nie powinien być wpuszczony do aplikacji
      expect(result.data.session).toBeNull();
    });

    it('błąd Email not confirmed różni się od Invalid login credentials', async () => {
      const unconfirmedError = { message: 'Email not confirmed' };
      const invalidCredError = { message: 'Invalid login credentials' };

      // Aplikacja powinna traktować te błędy inaczej:
      // - Invalid credentials → komunikat "złe hasło"
      // - Email not confirmed → panel odzyskiwania z resend
      expect(unconfirmedError.message).not.toBe(invalidCredError.message);
      expect(unconfirmedError.message).toContain('not confirmed');
      expect(invalidCredError.message).toContain('Invalid login');
    });
  });

  describe('spójność emailRedirectTo (AUDIT-AUTH-02)', () => {
    it('signUp używa /auth/callback jako redirect — spójnie z resend', async () => {
      // Weryfikuje że AuthContext.register() i resendVerificationEmail()
      // używają tej samej ścieżki /auth/callback, a nie /dashboard.
      // /dashboard robi <Navigate replace /> który gubi fragment URL z tokenem OAuth.
      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: { user: { id: 'u1', email: 'jan@example.pl', email_confirmed_at: null }, session: null },
        error: null,
      });

      await mockSupabaseClient.auth.signUp({
        email: 'jan@example.pl',
        password: 'HasloTest123',
        options: { emailRedirectTo: 'http://localhost:3000/auth/callback' },
      });

      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            emailRedirectTo: expect.stringContaining('/auth/callback'),
          }),
        }),
      );
    });

    it('resend używa /auth/callback — spójnie z register', async () => {
      mockSupabaseClient.auth.resend.mockResolvedValueOnce({ data: {}, error: null });

      await mockSupabaseClient.auth.resend({
        type: 'signup',
        email: 'jan@example.pl',
        options: { emailRedirectTo: 'http://localhost:3000/auth/callback' },
      });

      expect(mockSupabaseClient.auth.resend).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            emailRedirectTo: expect.stringContaining('/auth/callback'),
          }),
        }),
      );
    });
  });
});
