import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, Key, Bell, Globe, CreditCard, Calendar, FileText, Shield, Puzzle, Scale, Fingerprint } from 'lucide-react';
import { ApiKeysPanel } from '@/components/api/ApiKeysPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/settings/LanguageSwitcher';
import { BillingDashboard } from '@/components/billing/BillingDashboard';
import { CalendarSync } from '@/components/calendar/CalendarSync';
import { CompanyDocuments } from '@/components/documents/CompanyDocuments';
import { PushNotificationSettings } from '@/components/notifications/PushNotificationSettings';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AuditLogPanel } from '@/components/admin/AuditLogPanel';
import { PluginsPanel } from '@/components/plugins/PluginsPanel';
import { BiometricSettings } from '@/components/settings/BiometricSettings';
import { useUserSubscription } from '@/hooks/useSubscription';

export default function Settings() {
  const { t } = useTranslation();
  const { data: subscription } = useUserSubscription();
  const isAdmin = subscription?.plan_id === 'enterprise' || subscription?.plan_id === 'business';

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
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Dokumenty
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
              API
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              {t('settings.notifications')}
            </TabsTrigger>
            <TabsTrigger value="plugins" className="flex items-center gap-2">
              <Puzzle className="h-4 w-4" />
              {t('settings.plugins', 'Integracje')}
            </TabsTrigger>
            <TabsTrigger value="biometric" className="flex items-center gap-2">
              <Fingerprint className="h-4 w-4" />
              {t('settings.biometric', 'Biometria')}
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {t('settings.admin', 'Admin')}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="general" className="mt-4 space-y-4">
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

            {/* RODO / Legal Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  Prywatność i dane
                </CardTitle>
                <CardDescription>
                  Zarządzaj swoimi danymi zgodnie z RODO
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/legal/rodo">Centrum RODO</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/legal/privacy">Polityka Prywatności</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/legal/cookies">Polityka Cookies</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/legal/terms">Regulamin</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/legal/dpa">Umowa DPA</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <CompanyDocuments />
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
            <PushNotificationSettings />
          </TabsContent>

          <TabsContent value="plugins" className="mt-4">
            <PluginsPanel />
          </TabsContent>

          <TabsContent value="biometric" className="mt-4">
            <BiometricSettings />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin" className="mt-4 space-y-6">
              <AdminDashboard />
              <AuditLogPanel />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </>
  );
}
