import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, Bell, Globe, Calendar, FileText, Scale, Fingerprint } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/settings/LanguageSwitcher';
import { CalendarSync } from '@/components/calendar/CalendarSync';
import { CompanyDocuments } from '@/components/documents/CompanyDocuments';
import { PushNotificationSettings } from '@/components/notifications/PushNotificationSettings';
import { BiometricSettings } from '@/components/settings/BiometricSettings';

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
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <SettingsIcon className="h-6 w-6" />
            {t('settings.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('settings.subtitle')}
          </p>
        </div>

        <Tabs defaultValue="general">
          {/* Horizontally scrollable on mobile to prevent text overlap */}
          <div className="overflow-x-auto -mx-1 px-1">
            <TabsList className="inline-flex h-auto min-w-full gap-1 p-1">
              <TabsTrigger value="general" className="flex items-center gap-1.5 whitespace-nowrap text-xs sm:text-sm px-2.5 py-1.5 sm:px-3 sm:py-2">
                <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span>{t('settings.language')}</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-1.5 whitespace-nowrap text-xs sm:text-sm px-2.5 py-1.5 sm:px-3 sm:py-2">
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span>Dokumenty</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-1.5 whitespace-nowrap text-xs sm:text-sm px-2.5 py-1.5 sm:px-3 sm:py-2">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span>{t('nav.calendar')}</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-1.5 whitespace-nowrap text-xs sm:text-sm px-2.5 py-1.5 sm:px-3 sm:py-2">
                <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span>{t('settings.notifications')}</span>
              </TabsTrigger>
              <TabsTrigger value="biometric" className="flex items-center gap-1.5 whitespace-nowrap text-xs sm:text-sm px-2.5 py-1.5 sm:px-3 sm:py-2">
                <Fingerprint className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span>{t('settings.biometric', 'Biometria')}</span>
              </TabsTrigger>
            </TabsList>
          </div>

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

          <TabsContent value="notifications" className="mt-4">
            <PushNotificationSettings />
          </TabsContent>

          <TabsContent value="biometric" className="mt-4">
            <BiometricSettings />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
