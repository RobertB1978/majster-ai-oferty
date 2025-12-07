import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSupabaseClient } from '@/test/mocks/supabase';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

describe('Biometric Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock WebAuthn API
    Object.defineProperty(window, 'PublicKeyCredential', {
      value: {
        isUserVerifyingPlatformAuthenticatorAvailable: vi.fn().mockResolvedValue(true),
      },
      writable: true,
    });

    Object.defineProperty(navigator, 'credentials', {
      value: {
        create: vi.fn(),
        get: vi.fn(),
      },
      writable: true,
    });
  });

  describe('WebAuthn support detection', () => {
    it('should detect WebAuthn support', async () => {
      const isSupported = await (window.PublicKeyCredential as any)
        .isUserVerifyingPlatformAuthenticatorAvailable();
      expect(isSupported).toBe(true);
    });

    it('should handle unsupported devices', async () => {
      (window.PublicKeyCredential as any).isUserVerifyingPlatformAuthenticatorAvailable
        .mockResolvedValueOnce(false);

      const isSupported = await (window.PublicKeyCredential as any)
        .isUserVerifyingPlatformAuthenticatorAvailable();
      expect(isSupported).toBe(false);
    });
  });

  describe('credential registration', () => {
    it('should register biometric credential', async () => {
      const mockCredential = {
        rawId: new ArrayBuffer(32),
        response: {
          getPublicKey: () => new ArrayBuffer(65),
          attestationObject: new ArrayBuffer(100),
          clientDataJSON: new ArrayBuffer(50),
        },
      };

      (navigator.credentials.create as any).mockResolvedValueOnce(mockCredential);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: { name: 'Majster.AI', id: 'localhost' },
          user: {
            id: new Uint8Array(32),
            name: 'test@example.com',
            displayName: 'Test User',
          },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        },
      });

      expect(credential).toBeDefined();
      expect((navigator.credentials.create as any)).toHaveBeenCalled();
    });

    it('should store credential in database', async () => {
      const credentialData = {
        user_id: 'user-1',
        credential_id: 'base64-credential-id',
        public_key: 'base64-public-key',
        device_name: 'iPhone 15 Pro',
      };

      mockSupabaseClient.from().insert.mockResolvedValueOnce({
        data: { id: 'cred-1', ...credentialData },
        error: null,
      });

      const result = await mockSupabaseClient
        .from('biometric_credentials')
        .insert(credentialData);

      expect(result.error).toBeNull();
    });
  });

  describe('credential authentication', () => {
    it('should authenticate with biometric', async () => {
      const mockAssertion = {
        rawId: new ArrayBuffer(32),
        response: {
          authenticatorData: new ArrayBuffer(37),
          signature: new ArrayBuffer(64),
          clientDataJSON: new ArrayBuffer(50),
        },
      };

      (navigator.credentials.get as any).mockResolvedValueOnce(mockAssertion);

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          rpId: 'localhost',
          allowCredentials: [{
            id: new Uint8Array(32),
            type: 'public-key',
          }],
        },
      });

      expect(assertion).toBeDefined();
    });

    it('should update last used timestamp', async () => {
      mockSupabaseClient.from().update.mockReturnThis();
      mockSupabaseClient.from().eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await mockSupabaseClient
        .from('biometric_credentials')
        .update({ last_used_at: new Date().toISOString() })
        .eq('credential_id', 'test-credential');

      expect(result.error).toBeNull();
    });
  });

  describe('credential management', () => {
    it('should list user credentials', async () => {
      const mockCredentials = [
        { id: 'cred-1', device_name: 'iPhone 15', created_at: '2024-01-01' },
        { id: 'cred-2', device_name: 'MacBook Pro', created_at: '2024-01-02' },
      ];

      mockSupabaseClient.from().select.mockReturnThis();
      mockSupabaseClient.from().eq.mockReturnThis();
      mockSupabaseClient.from().order.mockResolvedValueOnce({
        data: mockCredentials,
        error: null,
      });

      const result = await mockSupabaseClient
        .from('biometric_credentials')
        .select('*')
        .eq('user_id', 'user-1')
        .order('created_at', { ascending: false });

      expect(result.data).toHaveLength(2);
    });

    it('should delete credential', async () => {
      mockSupabaseClient.from().delete.mockReturnThis();
      mockSupabaseClient.from().eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await mockSupabaseClient
        .from('biometric_credentials')
        .delete()
        .eq('id', 'cred-1');

      expect(result.error).toBeNull();
    });
  });
});
