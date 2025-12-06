import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, Key, Bell, Globe, CreditCard, Calendar } from 'lucide-react';
import { ApiKeysPanel } from '@/components/api/ApiKeysPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { LanguageSwitcher } from '@/components/settings/LanguageSwitcher';
import { BillingDashboard } from '@/components/billing/BillingDashboard';
import { CalendarSync } from '@/components/calendar/CalendarSync';

export default function Settings() {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>{t('settings.title')} | Majster.AI</title>
        <meta name="description" content={t('settings.subtitle')} />
      </Helmet>

      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <SettingsIcon className="h-6 w-6" />
            {t('settings.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('settings.subtitle')}
          </p>
        </div>

        <Tabs defaultValue="general">
          <TabsList className="flex-wrap">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t('settings.language')}
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t('nav.calendar')}
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {t('settings.billing')}
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Klucze API
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              {t('settings.notifications')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.language')}</CardTitle>
                <CardDescription>
                  Wybierz preferowany język aplikacji
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t('settings.language')}</Label>
                    <p className="text-sm text-muted-foreground">
                      Język interfejsu użytkownika
                    </p>
                  </div>
                  <LanguageSwitcher />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="mt-4">
            <CalendarSync />
          </TabsContent>

          <TabsContent value="billing" className="mt-4">
            <BillingDashboard />
          </TabsContent>

          <TabsContent value="api" className="mt-4">
            <ApiKeysPanel />
          </TabsContent>

          <TabsContent value="notifications" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.notifications')}</CardTitle>
                <CardDescription>
                  Zarządzaj ustawieniami powiadomień
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Powiadomienia email</Label>
                    <p className="text-sm text-muted-foreground">
                      Otrzymuj powiadomienia o nowych ofertach
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Powiadomienia push</Label>
                    <p className="text-sm text-muted-foreground">
                      Otrzymuj powiadomienia w przeglądarce
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Przypomnienia o terminach</Label>
                    <p className="text-sm text-muted-foreground">
                      Przypomnienia o zbliżających się terminach projektów
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
