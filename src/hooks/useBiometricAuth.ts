import { useState, useEffect, useCallback } from 'react';
// import { supabase } from '@/integrations/supabase/client';

interface BiometricCredential {
  credentialId: string;
  email: string;
  publicKey?: string;
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

// Helper to get the RP ID based on current environment
function getRpId(): string {
  const hostname = window.location.hostname;
  // For localhost, use 'localhost'
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'localhost';
  }
  // For production, use the full hostname
  return hostname;
}

export function useBiometricAuth() {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [browserInfo, setBrowserInfo] = useState<{ name: string; supportsWebAuthn: boolean }>({ 
    name: 'unknown', 
    supportsWebAuthn: false 
  });

  useEffect(() => {
    // Detect browser
    const userAgent = navigator.userAgent.toLowerCase();
    let browserName = 'unknown';
    if (userAgent.includes('chrome')) browserName = 'chrome';
    else if (userAgent.includes('safari')) browserName = 'safari';
    else if (userAgent.includes('firefox')) browserName = 'firefox';
    else if (userAgent.includes('edge')) browserName = 'edge';

    // Check if WebAuthn is supported
    const checkSupport = async () => {
      if (window.PublicKeyCredential) {
        try {
          // Check for platform authenticator (fingerprint, Face ID, Windows Hello)
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsSupported(available);
          setBrowserInfo({ name: browserName, supportsWebAuthn: available });
        } catch (e) {
          console.warn('WebAuthn check failed:', e);
          setIsSupported(false);
          setBrowserInfo({ name: browserName, supportsWebAuthn: false });
        }
      } else {
        setIsSupported(false);
        setBrowserInfo({ name: browserName, supportsWebAuthn: false });
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
    if (!isSupported) {
      console.warn('Biometric auth not supported on this device');
      return false;
    }

    try {
      setIsAuthenticating(true);

      // Generate a secure challenge
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      // Create user ID from email
      const userId = new TextEncoder().encode(email);
      const rpId = getRpId();

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'Majster.AI',
          id: rpId,
        },
        user: {
          id: userId,
          name: email,
          displayName: email.split('@')[0],
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },   // ES256 (recommended)
          { alg: -257, type: 'public-key' }, // RS256 (fallback)
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Use built-in authenticator
          userVerification: 'required',        // Require user verification
          residentKey: 'preferred',            // Prefer discoverable credentials
        },
        timeout: 60000,
        attestation: 'none', // Don't require attestation
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential | null;

      if (credential) {
        // Store the credential ID for future authentication
        const credentialIdBase64 = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
        
        storeCredential({
          credentialId: credentialIdBase64,
          email,
        });
        
        setIsEnabled(true);
        console.log('Biometric registration successful');
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
    if (!isSupported) {
      console.warn('Biometric auth not supported');
      return false;
    }

    const credentials = getStoredCredentials();
    const storedCredential = credentials.find(c => c.email === email);
    
    if (!storedCredential) {
      console.warn('No biometric credential found for this email');
      return false;
    }

    try {
      setIsAuthenticating(true);

      // Generate challenge
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      // Decode stored credential ID
      const credentialId = Uint8Array.from(atob(storedCredential.credentialId), c => c.charCodeAt(0));
      const rpId = getRpId();

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        rpId,
        allowCredentials: [{
          id: credentialId,
          type: 'public-key',
          transports: ['internal', 'hybrid'], // Support internal and hybrid (for cross-device)
        }],
        userVerification: 'required',
        timeout: 60000,
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      }) as PublicKeyCredential | null;

      if (assertion) {
        console.log('Biometric authentication successful');
        // Here you would normally send the assertion to your server for verification
        // For now, we just verify locally that the credential matches
        return true;
      }
      
      return false;
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
    console.log('Biometric disabled for', email);
  }, []);

  return {
    isSupported,
    isEnabled,
    isAuthenticating,
    browserInfo,
    checkIfEnabled,
    registerBiometric,
    authenticateWithBiometric,
    disableBiometric,
  };
}
