import { useState } from 'react';
// import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Fingerprint, Loader2, CheckCircle, Shield } from 'lucide-react';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { toast } from 'sonner';

interface BiometricSetupProps {
  email: string;
}

export function BiometricSetup({ email }: BiometricSetupProps) {
  const { 
    isSupported, 
    isEnabled, 
    isAuthenticating, 
    checkIfEnabled,
    registerBiometric, 
    disableBiometric 
  } = useBiometricAuth();
  const [enabled, setEnabled] = useState(() => checkIfEnabled(email));

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Logowanie biometryczne
          </CardTitle>
          <CardDescription>
            Twoje urządzenie nie obsługuje logowania biometrycznego
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      const success = await registerBiometric(email);
      if (success) {
        setEnabled(true);
        toast.success('Logowanie biometryczne zostało włączone');
      } else {
        toast.error('Nie udało się włączyć logowania biometrycznego');
      }
    } else {
      disableBiometric(email);
      setEnabled(false);
      toast.success('Logowanie biometryczne zostało wyłączone');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Bezpieczeństwo
        </CardTitle>
        <CardDescription>
          Skonfiguruj dodatkowe opcje bezpieczeństwa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Fingerprint className="h-5 w-5 text-primary" />
            </div>
            <div>
              <Label htmlFor="biometric" className="font-medium">
                Logowanie odciskiem palca
              </Label>
              <p className="text-sm text-muted-foreground">
                Szybkie i bezpieczne logowanie biometryczne
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticating && <Loader2 className="h-4 w-4 animate-spin" />}
            {enabled && <CheckCircle className="h-4 w-4 text-success" />}
            <Switch
              id="biometric"
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={isAuthenticating}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
