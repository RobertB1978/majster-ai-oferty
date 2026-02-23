import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Fingerprint, Loader2 } from 'lucide-react';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { useTranslation } from 'react-i18next';

interface BiometricLoginButtonProps {
  email: string;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export function BiometricLoginButton({ email, onSuccess, onError }: BiometricLoginButtonProps) {
  const { t } = useTranslation();
  const { isSupported, isAuthenticating, checkIfEnabled, authenticateWithBiometric } = useBiometricAuth();
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  // Check if biometric is available for this email
  useEffect(() => {
    if (email && isSupported) {
      const enabled = checkIfEnabled(email);
      setIsAvailable(enabled);
    } else {
      setIsAvailable(false);
    }
  }, [email, isSupported, checkIfEnabled]);

  if (!isSupported || !email || !isAvailable) {
    return null;
  }

  const handleBiometricLogin = async () => {
    const success = await authenticateWithBiometric(email);
    if (success) {
      onSuccess();
    } else {
      onError(t('auth.biometric.error', 'Uwierzytelnianie biometryczne nie powiodło się'));
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
          {t('auth.biometric.verifying', 'Weryfikacja...')}
        </>
      ) : (
        <>
          <Fingerprint className="mr-2 h-4 w-4" />
          {t('auth.biometric.loginLabel', 'Zaloguj odciskiem palca')}
        </>
      )}
    </Button>
  );
}
