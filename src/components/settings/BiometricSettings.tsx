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
  }, [isRegistering, deviceInfo.deviceName, deviceName]);

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

  const getDeviceTypeLabel = (type: string) => {
    switch (type) {
      case 'mobile': return t('settings.biometricSettings.devicePhone');
      case 'tablet': return t('settings.biometricSettings.deviceTablet');
      default: return t('settings.biometricSettings.deviceDesktop');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Fingerprint className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>{t('settings.biometric')}</CardTitle>
              <CardDescription>
                {t('settings.biometricDescription')}
              </CardDescription>
            </div>
          </div>
          {isSupported !== null && (
            <Badge variant={isSupported ? 'default' : 'secondary'}>
              {isSupported ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {t('settings.biometricSettings.supported')}
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  {t('settings.biometricSettings.notSupported')}
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
            <p className="text-sm font-medium">{t('settings.biometricSettings.detectedDevice')}</p>
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
              {t('settings.biometricSettings.biometricUnavailable')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('settings.biometricSettings.biometricUnavailableDesc', { browser: deviceInfo.browser, os: deviceInfo.os })}
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
                <Label className="text-sm font-medium">{t('settings.biometricSettings.registeredDevices', { count: credentials.length })}</Label>
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
                              {cred.device_name || t('settings.biometricSettings.unknownDevice')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t('settings.biometricSettings.added')} {formatDistanceToNow(new Date(cred.created_at), {
                                addSuffix: true,
                                locale: pl
                              })}
                              {cred.last_used_at && (
                                <> • {t('settings.biometricSettings.lastUsed')} {formatDistanceToNow(new Date(cred.last_used_at), {
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
                          aria-label={t('common.delete')}
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
                  {t('settings.biometricSettings.noDevices')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('settings.biometricSettings.addDevicePrompt', { icon: getBiometricIcon(deviceInfo.biometricType) })}
                </p>
              </div>
            )}

            {/* Register new credential */}
            {isRegistering ? (
              <div className="space-y-4 p-4 border border-primary/20 rounded-lg bg-primary/5">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <BiometricTypeIcon className="h-4 w-4" />
                  {t('settings.biometricSettings.registration', { icon: getBiometricIcon(deviceInfo.biometricType) })}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="device-name">{t('settings.biometricSettings.deviceName')}</Label>
                  <Input
                    id="device-name"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder={deviceInfo.deviceName}
                    className="bg-background"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('settings.biometricSettings.autoDetected', { name: deviceInfo.deviceName })}
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
                    {t('settings.biometricSettings.cancel')}
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
                    {t('settings.biometricSettings.register')}
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
                {t('settings.biometricSettings.addDevice', { type: getDeviceTypeLabel(deviceInfo.type) })}
              </Button>
            )}
          </>
        )}

        {/* Delete confirmation dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('settings.biometricSettings.deleteTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('settings.biometricSettings.deleteDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('settings.biometricSettings.deleteCancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteCredential.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {t('settings.biometricSettings.deleteConfirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
