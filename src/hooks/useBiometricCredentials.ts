import { logger } from '@/lib/logger';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface BiometricCredential {
  id: string;
  user_id: string;
  credential_id: string;
  public_key: string;
  counter: number;
  device_name: string | null;
  created_at: string;
  last_used_at: string | null;
}

// Helper to get RP ID
function getRpId(): string {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'localhost';
  }
  return hostname;
}

// Convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function useBiometricCredentials() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['biometric-credentials', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('biometric_credentials')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BiometricCredential[];
    },
    enabled: !!user,
  });
}

export function useRegisterBiometric() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (deviceName?: string) => {
      if (!user?.email) throw new Error('User not authenticated');

      // Check WebAuthn support
      if (!window.PublicKeyCredential) {
        throw new Error('WebAuthn nie jest wspierany w tej przeglądarce');
      }

      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        throw new Error('Urządzenie nie wspiera biometrii');
      }

      // Generate challenge
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const userId = new TextEncoder().encode(user.email);
      const rpId = getRpId();

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'Majster.AI',
          id: rpId,
        },
        user: {
          id: userId,
          name: user.email,
          displayName: user.email.split('@')[0],
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },   // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential | null;

      if (!credential) {
        throw new Error('Nie udało się utworzyć poświadczenia');
      }

      const response = credential.response as AuthenticatorAttestationResponse;
      const credentialIdBase64 = arrayBufferToBase64(credential.rawId);
      const publicKeyBase64 = arrayBufferToBase64(response.getPublicKey() || new ArrayBuffer(0));

      // Save to database
      const { error } = await supabase
        .from('biometric_credentials')
        .insert({
          user_id: user.id,
          credential_id: credentialIdBase64,
          public_key: publicKeyBase64,
          device_name: deviceName || navigator.userAgent.substring(0, 100),
        });

      if (error) throw error;

      return { credentialId: credentialIdBase64 };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biometric-credentials'] });
      toast.success('Biometria została zarejestrowana');
    },
    onError: (error) => {
      logger.error('Biometric registration error:', error);
      toast.error(error instanceof Error ? error.message : 'Błąd rejestracji biometrii');
    },
  });
}

export function useAuthenticateBiometric() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get stored credentials
      const { data: credentials, error: fetchError } = await supabase
        .from('biometric_credentials')
        .select('credential_id, counter')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;
      if (!credentials || credentials.length === 0) {
        throw new Error('Brak zarejestrowanych poświadczeń biometrycznych');
      }

      // Generate challenge
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const rpId = getRpId();

      const allowCredentials = credentials.map(cred => ({
        id: new Uint8Array(base64ToArrayBuffer(cred.credential_id)),
        type: 'public-key' as const,
        transports: ['internal', 'hybrid'] as AuthenticatorTransport[],
      }));

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        rpId,
        allowCredentials,
        userVerification: 'required',
        timeout: 60000,
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      }) as PublicKeyCredential | null;

      if (!assertion) {
        throw new Error('Autentykacja biometryczna nie powiodła się');
      }

      // Update last used timestamp and counter
      const credentialIdBase64 = arrayBufferToBase64(assertion.rawId);
      const response = assertion.response as AuthenticatorAssertionResponse;
      const newCounter = new DataView(response.authenticatorData).getUint32(33, false);

      await supabase
        .from('biometric_credentials')
        .update({ 
          last_used_at: new Date().toISOString(),
          counter: newCounter 
        })
        .eq('credential_id', credentialIdBase64);

      return true;
    },
    onSuccess: () => {
      toast.success('Autentykacja biometryczna udana');
    },
    onError: (error) => {
      logger.error('Biometric auth error:', error);
      toast.error(error instanceof Error ? error.message : 'Błąd autentykacji biometrycznej');
    },
  });
}

export function useDeleteBiometricCredential() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentialId: string) => {
      const { error } = await supabase
        .from('biometric_credentials')
        .delete()
        .eq('id', credentialId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biometric-credentials'] });
      toast.success('Poświadczenie biometryczne zostało usunięte');
    },
    onError: (error) => {
      logger.error('Delete credential error:', error);
      toast.error('Błąd podczas usuwania poświadczenia');
    },
  });
}
