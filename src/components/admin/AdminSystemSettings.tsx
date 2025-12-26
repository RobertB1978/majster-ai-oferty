import { useState } from 'react';
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
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface SystemSettings {
  // Email
  emailEnabled: boolean;
  smtpHost: string;
  smtpPort: string;
  emailFromName: string;
  emailFromAddress: string;
  
  // Features
  registrationEnabled: boolean;
  maintenanceMode: boolean;
  apiEnabled: boolean;
  aiEnabled: boolean;
  voiceEnabled: boolean;
  ocrEnabled: boolean;
  
  // Limits
  maxClientsPerUser: number;
  maxProjectsPerUser: number;
  maxStoragePerUser: number;
  sessionTimeout: number;
  
  // Security
  requireEmailVerification: boolean;
  twoFactorEnabled: boolean;
  rateLimitRequests: number;
  rateLimitWindow: number;
}

const defaultSettings: SystemSettings = {
  emailEnabled: true,
  smtpHost: '',
  smtpPort: '587',
  emailFromName: 'Majster.AI',
  emailFromAddress: 'noreply@majster.ai',
  registrationEnabled: true,
  maintenanceMode: false,
  apiEnabled: true,
  aiEnabled: true,
  voiceEnabled: true,
  ocrEnabled: true,
  maxClientsPerUser: 100,
  maxProjectsPerUser: 500,
  maxStoragePerUser: 1024,
  sessionTimeout: 60,
  requireEmailVerification: false,
  twoFactorEnabled: false,
  rateLimitRequests: 1000,
  rateLimitWindow: 60,
};

export function AdminSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('admin-system-settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });
  const [hasChanges, setHasChanges] = useState(false);

  const updateSetting = <K extends keyof SystemSettings>(
    key: K, 
    value: SystemSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const saveSettings = () => {
    localStorage.setItem('admin-system-settings', JSON.stringify(settings));
    setHasChanges(false);
    toast.success('Ustawienia zapisane');
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
    toast.info('Przywrócono domyślne ustawienia');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Ustawienia systemu
            </CardTitle>
            <CardDescription>
              Konfiguracja globalna aplikacji
            </CardDescription>
          </div>
          {hasChanges && (
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              Niezapisane zmiany
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">Ogólne</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="features">Funkcje</TabsTrigger>
            <TabsTrigger value="limits">Limity</TabsTrigger>
            <TabsTrigger value="security">Bezpieczeństwo</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6 mt-4">
            {/* Maintenance Mode */}
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${settings.maintenanceMode ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                  {settings.maintenanceMode ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                </div>
                <div>
                  <Label className="text-base">Tryb konserwacji</Label>
                  <p className="text-sm text-muted-foreground">
                    {settings.maintenanceMode 
                      ? 'Aplikacja niedostępna dla użytkowników' 
                      : 'Aplikacja działa normalnie'}
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(v) => updateSetting('maintenanceMode', v)}
              />
            </div>

            {/* Registration */}
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label>Rejestracja nowych użytkowników</Label>
                  <p className="text-sm text-muted-foreground">
                    Pozwól na zakładanie nowych kont
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.registrationEnabled}
                onCheckedChange={(v) => updateSetting('registrationEnabled', v)}
              />
            </div>

            {/* Session Timeout */}
            <div className="space-y-2">
              <Label>Czas sesji (minuty)</Label>
              <Input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value) || 60)}
                min={5}
                max={1440}
              />
              <p className="text-sm text-muted-foreground">
                Automatyczne wylogowanie po okresie nieaktywności
              </p>
            </div>
          </TabsContent>

          <TabsContent value="email" className="space-y-6 mt-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label>Wysyłka email</Label>
                  <p className="text-sm text-muted-foreground">
                    Włącz/wyłącz wysyłkę emaili z aplikacji
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.emailEnabled}
                onCheckedChange={(v) => updateSetting('emailEnabled', v)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nazwa nadawcy</Label>
                <Input
                  value={settings.emailFromName}
                  onChange={(e) => updateSetting('emailFromName', e.target.value)}
                  placeholder="Majster.AI"
                />
              </div>
              <div className="space-y-2">
                <Label>Adres nadawcy</Label>
                <Input
                  type="email"
                  value={settings.emailFromAddress}
                  onChange={(e) => updateSetting('emailFromAddress', e.target.value)}
                  placeholder="noreply@majster.ai"
                />
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 border border-dashed">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Konfiguracja SMTP wymaga klucza API (Resend)
              </p>
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-4 mt-4">
            {[
              { key: 'apiEnabled', label: 'API publiczne', icon: Server, desc: 'Dostęp do API dla zewnętrznych integracji' },
              { key: 'aiEnabled', label: 'Funkcje AI', icon: Zap, desc: 'Sugestie AI, analiza zdjęć, generowanie wycen' },
              { key: 'voiceEnabled', label: 'Voice-to-Quote', icon: Bell, desc: 'Dyktowanie pozycji wyceny głosem' },
              { key: 'ocrEnabled', label: 'OCR Faktur', icon: HardDrive, desc: 'Automatyczne rozpoznawanie faktur' },
            ].map(({ key, label, icon: Icon, desc }) => (
              <div key={key} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label>{label}</Label>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                </div>
                <Switch
                  checked={settings[key as keyof SystemSettings] as boolean}
                  onCheckedChange={(v) => updateSetting(key as keyof SystemSettings, v)}
                />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="limits" className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Max klientów na użytkownika</Label>
                <Input
                  type="number"
                  value={settings.maxClientsPerUser}
                  onChange={(e) => updateSetting('maxClientsPerUser', parseInt(e.target.value) || 100)}
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label>Max projektów na użytkownika</Label>
                <Input
                  type="number"
                  value={settings.maxProjectsPerUser}
                  onChange={(e) => updateSetting('maxProjectsPerUser', parseInt(e.target.value) || 500)}
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label>Max storage (MB)</Label>
                <Input
                  type="number"
                  value={settings.maxStoragePerUser}
                  onChange={(e) => updateSetting('maxStoragePerUser', parseInt(e.target.value) || 1024)}
                  min={10}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6 mt-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label>Weryfikacja email</Label>
                  <p className="text-sm text-muted-foreground">
                    Wymagaj potwierdzenia email przy rejestracji
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.requireEmailVerification}
                onCheckedChange={(v) => updateSetting('requireEmailVerification', v)}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label>Uwierzytelnianie dwuskładnikowe (2FA)</Label>
                  <p className="text-sm text-muted-foreground">
                    Opcjonalne 2FA dla użytkowników
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.twoFactorEnabled}
                onCheckedChange={(v) => updateSetting('twoFactorEnabled', v)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rate limit (requestów)</Label>
                <Input
                  type="number"
                  value={settings.rateLimitRequests}
                  onChange={(e) => updateSetting('rateLimitRequests', parseInt(e.target.value) || 1000)}
                  min={10}
                />
              </div>
              <div className="space-y-2">
                <Label>Okno czasowe (sekundy)</Label>
                <Input
                  type="number"
                  value={settings.rateLimitWindow}
                  onChange={(e) => updateSetting('rateLimitWindow', parseInt(e.target.value) || 60)}
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
            Resetuj
          </Button>
          <Button onClick={saveSettings} disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            Zapisz ustawienia
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
