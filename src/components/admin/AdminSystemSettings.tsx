import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  Mail,
  Shield,
  Zap,
  Globe,
  Bell,
  Lock,
  Server,
  HardDrive,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Loader
} from 'lucide-react';

interface DisplaySettings {
  email_enabled: boolean;
  smtp_host: string;
  smtp_port: number;
  email_from_name: string;
  email_from_address: string;
  registration_enabled: boolean;
  maintenance_mode: boolean;
  api_enabled: boolean;
  ai_enabled: boolean;
  voice_enabled: boolean;
  ocr_enabled: boolean;
  max_clients_per_user: number;
  max_projects_per_user: number;
  max_storage_per_user: number;
  session_timeout_minutes: number;
  require_email_verification: boolean;
  two_factor_enabled: boolean;
  rate_limit_requests: number;
  rate_limit_window_seconds: number;
}

export function AdminSystemSettings() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const organizationId = session?.user?.user_metadata?.organization_id;
  const { settings: dbSettings, loading, error, updateSettings, resetSettings: resetDbSettings } = useAdminSettings(organizationId);
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize display settings from database
  useEffect(() => {
    if (dbSettings) {
      setDisplaySettings({
        email_enabled: dbSettings.email_enabled ?? true,
        smtp_host: dbSettings.smtp_host ?? '',
        smtp_port: dbSettings.smtp_port ?? 587,
        email_from_name: dbSettings.email_from_name ?? 'Majster.AI',
        email_from_address: dbSettings.email_from_address ?? 'noreply@majster.ai',
        registration_enabled: dbSettings.registration_enabled ?? true,
        maintenance_mode: dbSettings.maintenance_mode ?? false,
        api_enabled: dbSettings.api_enabled ?? true,
        ai_enabled: dbSettings.ai_enabled ?? true,
        voice_enabled: dbSettings.voice_enabled ?? true,
        ocr_enabled: dbSettings.ocr_enabled ?? true,
        max_clients_per_user: dbSettings.max_clients_per_user ?? 1000,
        max_projects_per_user: dbSettings.max_projects_per_user ?? 500,
        max_storage_per_user: dbSettings.max_storage_per_user ?? 10737418240,
        session_timeout_minutes: dbSettings.session_timeout_minutes ?? 30,
        require_email_verification: dbSettings.require_email_verification ?? true,
        two_factor_enabled: dbSettings.two_factor_enabled ?? false,
        rate_limit_requests: dbSettings.rate_limit_requests ?? 100,
        rate_limit_window_seconds: dbSettings.rate_limit_window_seconds ?? 60,
      });
      setHasChanges(false);
    }
  }, [dbSettings]);

  const updateSetting = <K extends keyof DisplaySettings>(
    key: K,
    value: DisplaySettings[K]
  ) => {
    setDisplaySettings(prev => prev ? { ...prev, [key]: value } : null);
    setHasChanges(true);
  };

  const saveSettings = async () => {
    if (displaySettings) {
      await updateSettings(displaySettings);
      setHasChanges(false);
    }
  };

  const resetSettings = () => {
    resetDbSettings();
    setHasChanges(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader className="h-5 w-5 animate-spin" />
          <span className="ml-2">{t('adminSettings.loadingSettings')}</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !displaySettings) {
    return (
      <Card>
        <CardContent className="pt-6 text-red-600">
          {t('adminSettings.errorLoadingSettings')} {error?.message || t('adminSettings.unknownError')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t('adminSettings.systemSettings')}
            </CardTitle>
            <CardDescription>
              {t('adminSettings.globalConfiguration')}
            </CardDescription>
          </div>
          {(hasChanges || error) && (
            <Badge variant="outline" className={`${error ? 'text-red-600 border-red-600' : 'text-orange-600 border-orange-600'}`}>
              {error ? t('adminSettings.error') : t('adminSettings.unsavedChanges')}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">{t('adminSettings.tabs.general')}</TabsTrigger>
            <TabsTrigger value="email">{t('adminSettings.tabs.email')}</TabsTrigger>
            <TabsTrigger value="features">{t('adminSettings.tabs.features')}</TabsTrigger>
            <TabsTrigger value="limits">{t('adminSettings.tabs.limits')}</TabsTrigger>
            <TabsTrigger value="security">{t('adminSettings.tabs.security')}</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6 mt-4">
            {/* Maintenance Mode */}
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${displaySettings.maintenance_mode ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                  {displaySettings.maintenance_mode ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                </div>
                <div>
                  <Label className="text-base">{t('adminSettings.maintenanceMode')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {displaySettings.maintenance_mode
                      ? t('adminSettings.maintenanceModeActive')
                      : t('adminSettings.normalOperation')}
                  </p>
                </div>
              </div>
              <Switch
                checked={displaySettings.maintenance_mode}
                onCheckedChange={(v) => updateSetting('maintenance_mode', v)}
              />
            </div>

            {/* Registration */}
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label>{t('adminSettings.registration')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('adminSettings.registrationDesc')}
                  </p>
                </div>
              </div>
              <Switch
                checked={displaySettings.registration_enabled}
                onCheckedChange={(v) => updateSetting('registration_enabled', v)}
              />
            </div>

            {/* Session Timeout */}
            <div className="space-y-2">
              <Label>{t('adminSettings.sessionTimeout')}</Label>
              <Input
                type="number"
                value={displaySettings.session_timeout_minutes}
                onChange={(e) => updateSetting('session_timeout_minutes', parseInt(e.target.value) || 30)}
                min={5}
                max={1440}
              />
              <p className="text-sm text-muted-foreground">
                {t('adminSettings.sessionTimeoutDesc')}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="email" className="space-y-6 mt-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label>{t('adminSettings.emailSending')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('adminSettings.emailSendingDesc')}
                  </p>
                </div>
              </div>
              <Switch
                checked={displaySettings.email_enabled}
                onCheckedChange={(v) => updateSetting('email_enabled', v)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('adminSettings.senderName')}</Label>
                <Input
                  value={displaySettings.email_from_name}
                  onChange={(e) => updateSetting('email_from_name', e.target.value)}
                  placeholder="Majster.AI"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('adminSettings.senderAddress')}</Label>
                <Input
                  type="email"
                  value={displaySettings.email_from_address}
                  onChange={(e) => updateSetting('email_from_address', e.target.value)}
                  placeholder="noreply@majster.ai"
                />
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 border border-dashed">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Lock className="h-4 w-4" />
                {t('adminSettings.smtpConfigNote')}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-4 mt-4">
            {[
              { key: 'api_enabled', labelKey: 'publicApi', descKey: 'publicApiDesc', icon: Server },
              { key: 'ai_enabled', labelKey: 'aiFeatures', descKey: 'aiFeaturesDesc', icon: Zap },
              { key: 'voice_enabled', labelKey: 'voiceToQuote', descKey: 'voiceToQuoteDesc', icon: Bell },
              { key: 'ocr_enabled', labelKey: 'ocrInvoices', descKey: 'ocrInvoicesDesc', icon: HardDrive },
            ].map(({ key, labelKey, descKey, icon: Icon }) => (
              <div key={key} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label>{t(`adminSettings.${labelKey}`)}</Label>
                    <p className="text-sm text-muted-foreground">{t(`adminSettings.${descKey}`)}</p>
                  </div>
                </div>
                <Switch
                  checked={displaySettings[key as keyof DisplaySettings] as boolean}
                  onCheckedChange={(v) => updateSetting(key as keyof DisplaySettings, v)}
                />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="limits" className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>{t('adminSettings.maxClientsPerUser')}</Label>
                <Input
                  type="number"
                  value={displaySettings.max_clients_per_user}
                  onChange={(e) => updateSetting('max_clients_per_user', parseInt(e.target.value) || 1000)}
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('adminSettings.maxProjectsPerUser')}</Label>
                <Input
                  type="number"
                  value={displaySettings.max_projects_per_user}
                  onChange={(e) => updateSetting('max_projects_per_user', parseInt(e.target.value) || 500)}
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('adminSettings.maxStorageGb')}</Label>
                <Input
                  type="number"
                  value={Math.round(displaySettings.max_storage_per_user / 1073741824)}
                  onChange={(e) => updateSetting('max_storage_per_user', parseInt(e.target.value) * 1073741824 || 10737418240)}
                  min={1}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6 mt-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label>{t('adminSettings.emailVerification')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('adminSettings.emailVerificationDesc')}
                  </p>
                </div>
              </div>
              <Switch
                checked={displaySettings.require_email_verification}
                onCheckedChange={(v) => updateSetting('require_email_verification', v)}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label>{t('adminSettings.twoFactorAuth')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('adminSettings.twoFactorAuthDesc')}
                  </p>
                </div>
              </div>
              <Switch
                checked={displaySettings.two_factor_enabled}
                onCheckedChange={(v) => updateSetting('two_factor_enabled', v)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('adminSettings.rateLimit')}</Label>
                <Input
                  type="number"
                  value={displaySettings.rate_limit_requests}
                  onChange={(e) => updateSetting('rate_limit_requests', parseInt(e.target.value) || 100)}
                  min={10}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('adminSettings.rateLimitWindow')}</Label>
                <Input
                  type="number"
                  value={displaySettings.rate_limit_window_seconds}
                  onChange={(e) => updateSetting('rate_limit_window_seconds', parseInt(e.target.value) || 60)}
                  min={1}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <Button variant="outline" onClick={resetSettings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('adminSettings.resetSettings')}
          </Button>
          <Button onClick={saveSettings} disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            {t('adminSettings.saveSettings')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
