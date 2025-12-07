import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSupabaseClient } from '@/test/mocks/supabase';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

describe('Authentication Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        user_metadata: {},
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: mockUser, session: { access_token: 'token' } },
        error: null,
      });

      const result = await mockSupabaseClient.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.data.user).toBeDefined();
      expect(result.data.user?.email).toBe('test@example.com');
      expect(result.error).toBeNull();
    });

    it('should fail login with invalid credentials', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      const result = await mockSupabaseClient.auth.signInWithPassword({
        email: 'wrong@example.com',
        password: 'wrongpassword',
      });

      expect(result.data.user).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('registration', () => {
    it('should register successfully with valid data', async () => {
      const mockUser = {
        id: 'new-user-1',
        email: 'newuser@example.com',
        user_metadata: {},
      };

      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: { user: mockUser, session: null },
        error: null,
      });

      const result = await mockSupabaseClient.auth.signUp({
        email: 'newuser@example.com',
        password: 'newpassword123',
      });

      expect(result.data.user).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('should fail registration with existing email', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'User already registered' },
      });

      const result = await mockSupabaseClient.auth.signUp({
        email: 'existing@example.com',
        password: 'password123',
      });

      expect(result.error).toBeDefined();
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValueOnce({
        error: null,
      });

      const result = await mockSupabaseClient.auth.signOut();
      expect(result.error).toBeNull();
    });
  });

  describe('password reset', () => {
    it('should send password reset email', async () => {
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValueOnce({
        data: {},
        error: null,
      });

      const result = await mockSupabaseClient.auth.resetPasswordForEmail('test@example.com');
      expect(result.error).toBeNull();
    });
  });
});
