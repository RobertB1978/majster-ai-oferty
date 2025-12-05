import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Fingerprint, Loader2 } from 'lucide-react';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';

interface BiometricLoginButtonProps {
  email: string;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export function BiometricLoginButton({ email, onSuccess, onError }: BiometricLoginButtonProps) {
  const { isSupported, isAuthenticating, checkIfEnabled, authenticateWithBiometric } = useBiometricAuth();
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  // Check if biometric is available for this email
  useState(() => {
    if (email && isSupported) {
      const enabled = checkIfEnabled(email);
      setIsAvailable(enabled);
    }
  });

  if (!isSupported || !email || !isAvailable) {
    return null;
  }

  const handleBiometricLogin = async () => {
    const success = await authenticateWithBiometric(email);
    if (success) {
      onSuccess();
    } else {
      onError('Uwierzytelnianie biometryczne nie powiodło się');
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={handleBiometricLogin}
      disabled={isAuthenticating}
    >
      {isAuthenticating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Weryfikacja...
        </>
      ) : (
        <>
          <Fingerprint className="mr-2 h-4 w-4" />
          Zaloguj odciskiem palca
        </>
      )}
    </Button>
  );
}
