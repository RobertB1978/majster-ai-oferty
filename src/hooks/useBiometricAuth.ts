import { useState, useEffect, useCallback } from 'react';

interface BiometricCredential {
  credentialId: string;
  email: string;
}

const CREDENTIALS_STORAGE_KEY = 'majster_biometric_credentials';

function getStoredCredentials(): BiometricCredential[] {
  try {
    const stored = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function storeCredential(credential: BiometricCredential) {
  const credentials = getStoredCredentials();
  const existing = credentials.findIndex(c => c.email === credential.email);
  if (existing >= 0) {
    credentials[existing] = credential;
  } else {
    credentials.push(credential);
  }
  localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(credentials));
}

function removeCredential(email: string) {
  const credentials = getStoredCredentials().filter(c => c.email !== email);
  localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(credentials));
}

export function useBiometricAuth() {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    // Check if WebAuthn is supported
    const checkSupport = async () => {
      if (window.PublicKeyCredential) {
        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsSupported(available);
        } catch {
          setIsSupported(false);
        }
      }
    };
    checkSupport();
  }, []);

  const checkIfEnabled = useCallback((email: string): boolean => {
    const credentials = getStoredCredentials();
    const hasCredential = credentials.some(c => c.email === email);
    setIsEnabled(hasCredential);
    return hasCredential;
  }, []);

  const registerBiometric = useCallback(async (email: string): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      setIsAuthenticating(true);

      // Generate a challenge (in production, this should come from the server)
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const userId = new TextEncoder().encode(email);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'Majster.AI',
          id: window.location.hostname,
        },
        user: {
          id: userId,
          name: email,
          displayName: email,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
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
      }) as PublicKeyCredential;

      if (credential) {
        // Store the credential ID locally
        storeCredential({
          credentialId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
          email,
        });
        setIsEnabled(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Biometric registration failed:', error);
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, [isSupported]);

  const authenticateWithBiometric = useCallback(async (email: string): Promise<boolean> => {
    if (!isSupported) return false;

    const credentials = getStoredCredentials();
    const storedCredential = credentials.find(c => c.email === email);
    
    if (!storedCredential) return false;

    try {
      setIsAuthenticating(true);

      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const credentialId = Uint8Array.from(atob(storedCredential.credentialId), c => c.charCodeAt(0));

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        rpId: window.location.hostname,
        allowCredentials: [{
          id: credentialId,
          type: 'public-key',
          transports: ['internal'],
        }],
        userVerification: 'required',
        timeout: 60000,
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      }) as PublicKeyCredential;

      return !!assertion;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, [isSupported]);

  const disableBiometric = useCallback((email: string) => {
    removeCredential(email);
    setIsEnabled(false);
  }, []);

  return {
    isSupported,
    isEnabled,
    isAuthenticating,
    checkIfEnabled,
    registerBiometric,
    authenticateWithBiometric,
    disableBiometric,
  };
}
