import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Fingerprint, 
  Plus, 
  Trash2, 
  Smartphone, 
  Loader2,
  Shield,
  CheckCircle,
  XCircle,
  Monitor,
  Tablet,
  ScanFace
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { 
  useBiometricCredentials, 
  useRegisterBiometric, 
  useDeleteBiometricCredential 
} from '@/hooks/useBiometricCredentials';
import { useDeviceDetection, getBiometricIcon } from '@/hooks/useDeviceDetection';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';

export function BiometricSettings() {
  const { t } = useTranslation();
  const { data: credentials, isLoading } = useBiometricCredentials();
  const registerBiometric = useRegisterBiometric();
  const deleteCredential = useDeleteBiometricCredential();
  const deviceInfo = useDeviceDetection();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  // Auto-fill device name when registering
  useEffect(() => {
    if (isRegistering && !deviceName) {
      setDeviceName(deviceInfo.deviceName);
    }
  }, [deviceInfo.deviceName, deviceName, isRegistering]);

  // Check WebAuthn support
  useEffect(() => {
    const checkSupport = async () => {
      if (window.PublicKeyCredential) {
        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsSupported(available);
        } catch {
          setIsSupported(false);
        }
      } else {
        setIsSupported(false);
      }
    };
    checkSupport();
  }, []);

  const handleRegister = async () => {
    await registerBiometric.mutateAsync(deviceName || deviceInfo.deviceName);
    setDeviceName('');
    setIsRegistering(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteCredential.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  // Get device icon based on type
  const getDeviceIcon = (type: 'mobile' | 'tablet' | 'desktop') => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="h-5 w-5 text-primary" />;
      case 'tablet':
        return <Tablet className="h-5 w-5 text-primary" />;
      default:
        return <Monitor className="h-5 w-5 text-primary" />;
    }
  };

  // Get biometric icon component
  const BiometricTypeIcon = deviceInfo.biometricType === 'face' 
    ? ScanFace 
    : Fingerprint;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Fingerprint className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>{t('settings.biometric', 'Logowanie biometryczne')}</CardTitle>
              <CardDescription>
                {t('settings.biometricDescription', 'Używaj odcisku palca lub Face ID do logowania')}
              </CardDescription>
            </div>
          </div>
          {isSupported !== null && (
            <Badge variant={isSupported ? 'default' : 'secondary'}>
              {isSupported ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Obsługiwane
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  Nieobsługiwane
                </>
              )}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current device info */}
        <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg border border-border/50">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            {getDeviceIcon(deviceInfo.type)}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Wykryte urządzenie</p>
            <p className="text-xs text-muted-foreground">
              {deviceInfo.deviceName}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <BiometricTypeIcon className="h-3 w-3" />
              <span>{getBiometricIcon(deviceInfo.biometricType)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {deviceInfo.browser} • {deviceInfo.os}
            </p>
          </div>
        </div>

        {!isSupported && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
            <Shield className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-destructive font-medium mb-1">
              Biometria niedostępna
            </p>
            <p className="text-xs text-muted-foreground">
              Twoja przeglądarka ({deviceInfo.browser}) lub urządzenie ({deviceInfo.os}) nie wspiera logowania biometrycznego (WebAuthn).
            </p>
          </div>
        )}

        {isSupported && (
          <>
            {/* Registered credentials */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : credentials && credentials.length > 0 ? (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Zarejestrowane urządzenia ({credentials.length})</Label>
                <div className="space-y-2">
                  {credentials.map((cred) => {
                    // Detect device type from stored name
                    const isPhone = /iPhone|Android|Phone|Mobile/i.test(cred.device_name || '');
                    const isTabletDevice = /iPad|Tablet/i.test(cred.device_name || '');
                    const credDeviceType = isTabletDevice ? 'tablet' : (isPhone ? 'mobile' : 'desktop');
                    
                    return (
                      <div 
                        key={cred.id} 
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50 hover:border-border transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            {getDeviceIcon(credDeviceType)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {cred.device_name || 'Nieznane urządzenie'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Dodano {formatDistanceToNow(new Date(cred.created_at), { 
                                addSuffix: true, 
                                locale: pl 
                              })}
                              {cred.last_used_at && (
                                <> • Ostatnio użyto {formatDistanceToNow(new Date(cred.last_used_at), { 
                                  addSuffix: true, 
                                  locale: pl 
                                })}</>
                              )}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteId(cred.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed border-border">
                <BiometricTypeIcon className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Brak zarejestrowanych urządzeń biometrycznych
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Dodaj swoje urządzenie, aby logować się za pomocą {getBiometricIcon(deviceInfo.biometricType)}
                </p>
              </div>
            )}

            {/* Register new credential */}
            {isRegistering ? (
              <div className="space-y-4 p-4 border border-primary/20 rounded-lg bg-primary/5">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <BiometricTypeIcon className="h-4 w-4" />
                  Rejestracja {getBiometricIcon(deviceInfo.biometricType)}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="device-name">Nazwa urządzenia</Label>
                  <Input
                    id="device-name"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder={deviceInfo.deviceName}
                    className="bg-background"
                  />
                  <p className="text-xs text-muted-foreground">
                    Automatycznie wykryto: {deviceInfo.deviceName}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsRegistering(false);
                      setDeviceName('');
                    }}
                    className="flex-1"
                  >
                    Anuluj
                  </Button>
                  <Button
                    onClick={handleRegister}
                    disabled={registerBiometric.isPending}
                    className="flex-1"
                  >
                    {registerBiometric.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <BiometricTypeIcon className="h-4 w-4 mr-2" />
                    )}
                    Zarejestruj
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setIsRegistering(true)}
                variant="outline"
                className="w-full border-dashed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Dodaj to urządzenie ({deviceInfo.type === 'mobile' ? 'telefon' : deviceInfo.type === 'tablet' ? 'tablet' : 'komputer'})
              </Button>
            )}
          </>
        )}

        {/* Delete confirmation dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Usuń poświadczenie biometryczne?</AlertDialogTitle>
              <AlertDialogDescription>
                Po usunięciu nie będziesz mógł używać tego urządzenia do logowania biometrycznego. 
                Możesz je ponownie zarejestrować w dowolnym momencie.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Anuluj</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteCredential.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Usuń
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
