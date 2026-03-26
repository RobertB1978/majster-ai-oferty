import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, Bell, Globe, Calendar, FileText, Scale, Fingerprint, Mail, Building2, UserX, CreditCard, ShieldCheck, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useDenseMode } from '@/hooks/useDenseMode';
import { LanguageSwitcher } from '@/components/settings/LanguageSwitcher';
import { ContactEmailSettings } from '@/components/settings/ContactEmailSettings';
import { DeleteAccountSection } from '@/components/settings/DeleteAccountSection';
import { CalendarSync } from '@/components/calendar/CalendarSync';
import { CompanyDocuments } from '@/components/documents/CompanyDocuments';
import { PushNotificationSettings } from '@/components/notifications/PushNotificationSettings';
import { BiometricSettings } from '@/components/settings/BiometricSettings';
import CompanyProfile from '@/pages/CompanyProfile';
import { SubscriptionSection } from '@/components/billing/SubscriptionSection';

// AUTH-01: Biometric auth does not complete a Supabase session (dead code path).
// Disabled until fully implemented. Change to true to re-enable.
const BIOMETRIC_FEATURE_ENABLED = false;

// P11: Push notification settings are not persisted (no localStorage/DB).
// Hidden until persistence is implemented to avoid pretending readiness.
const PUSH_NOTIFICATIONS_ENABLED = false;

// BETA-CAL-01: Calendar sync has zero functional providers (OAuth not wired).
// Showing a tab that leads only to "Coming Soon" badges erodes beta trust.
// Hidden until at least one provider is live. Change to true to re-enable.
const CALENDAR_SYNC_SETTINGS_VISIBLE = false;

interface SettingsSection {
  id: string;
  icon: React.ElementType;
  labelKey: string;
}

const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: 'company',      icon: Building2,  labelKey: 'settings.companyProfileTab' },
  { id: 'general',      icon: Globe,       labelKey: 'settings.language' },
  { id: 'documents',    icon: FileText,    labelKey: 'settings.documents' },
  ...(CALENDAR_SYNC_SETTINGS_VISIBLE
    ? [{ id: 'calendar', icon: Calendar, labelKey: 'nav.calendar' } as SettingsSection]
    : []),
  { id: 'email',        icon: Mail,        labelKey: 'settings.contactEmailTab' },
  { id: 'subscription', icon: CreditCard,  labelKey: 'settings.subscriptionTab' },
  { id: 'privacy',      icon: ShieldCheck, labelKey: 'settings.privacy' },
  { id: 'account',      icon: UserX,       labelKey: 'settings.accountTab' },
];

export default function Settings() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('company');
  const { dense, toggleDense } = useDenseMode();

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

        <Tabs value={activeTab} onValueChange={setActiveTab}>

          {/* ── MOBILE nav: vertical list (no horizontal scrolling) ── */}
          <nav className="sm:hidden space-y-1 mb-4" aria-label={t('settings.title')}>
            {SETTINGS_SECTIONS.map(({ id, icon: Icon, labelKey }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                data-testid={`settings-mobile-nav-${id}`}
                className={[
                  'w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                  activeTab === id
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-muted',
                ].join(' ')}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{t(labelKey)}</span>
                {activeTab === id && <ChevronRight className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </nav>

          {/* ── DESKTOP nav: original horizontal tabs ── */}
          <div className="hidden sm:block overflow-x-auto -mx-1 px-1">
            <TabsList className="inline-flex h-auto min-w-full gap-1 p-1">
              <TabsTrigger value="company" className="flex items-center gap-1.5 whitespace-nowrap text-xs sm:text-sm px-2.5 py-1.5 sm:px-3 sm:py-2">
                <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span>{t('settings.companyProfileTab')}</span>
              </TabsTrigger>
              <TabsTrigger value="general" className="flex items-center gap-1.5 whitespace-nowrap text-xs sm:text-sm px-2.5 py-1.5 sm:px-3 sm:py-2">
                <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span>{t('settings.language')}</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-1.5 whitespace-nowrap text-xs sm:text-sm px-2.5 py-1.5 sm:px-3 sm:py-2">
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span>{t('settings.documents')}</span>
              </TabsTrigger>
              {CALENDAR_SYNC_SETTINGS_VISIBLE && (
                <TabsTrigger value="calendar" className="flex items-center gap-1.5 whitespace-nowrap text-xs sm:text-sm px-2.5 py-1.5 sm:px-3 sm:py-2">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  <span>{t('nav.calendar')}</span>
                </TabsTrigger>
              )}
              {PUSH_NOTIFICATIONS_ENABLED && (
                <TabsTrigger value="notifications" className="flex items-center gap-1.5 whitespace-nowrap text-xs sm:text-sm px-2.5 py-1.5 sm:px-3 sm:py-2">
                  <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  <span>{t('settings.notifications')}</span>
                </TabsTrigger>
              )}
              {BIOMETRIC_FEATURE_ENABLED && (
                <TabsTrigger value="biometric" className="flex items-center gap-1.5 whitespace-nowrap text-xs sm:text-sm px-2.5 py-1.5 sm:px-3 sm:py-2">
                  <Fingerprint className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  <span>{t('settings.biometric')}</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="email" className="flex items-center gap-1.5 whitespace-nowrap text-xs sm:text-sm px-2.5 py-1.5 sm:px-3 sm:py-2">
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span>{t('settings.contactEmailTab')}</span>
              </TabsTrigger>
              <TabsTrigger value="subscription" className="flex items-center gap-1.5 whitespace-nowrap text-xs sm:text-sm px-2.5 py-1.5 sm:px-3 sm:py-2">
                <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span>{t('settings.subscriptionTab')}</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-1.5 whitespace-nowrap text-xs sm:text-sm px-2.5 py-1.5 sm:px-3 sm:py-2">
                <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span>{t('settings.privacy')}</span>
              </TabsTrigger>
              <TabsTrigger value="account" className="flex items-center gap-1.5 whitespace-nowrap text-xs sm:text-sm px-2.5 py-1.5 sm:px-3 sm:py-2">
                <UserX className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span>{t('settings.accountTab')}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Company Profile tab — issuer data for PDF */}
          <TabsContent value="company" className="mt-4">
            <CompanyProfile />
          </TabsContent>

          <TabsContent value="general" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.language')}</CardTitle>
                <CardDescription>
                  {t('settings.languageSelectDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t('settings.language')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.languageLabel')}
                    </p>
                  </div>
                  <LanguageSwitcher />
                </div>
              </CardContent>
            </Card>

            {/* Dense Office Mode — P2, desktop only */}
            <Card className="hidden md:block">
              <CardHeader>
                <CardTitle>{t('settings.denseMode')}</CardTitle>
                <CardDescription>
                  {t('settings.denseModeDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="dense-mode-toggle">{t('settings.denseMode')}</Label>
                  <Switch
                    id="dense-mode-toggle"
                    checked={dense}
                    onCheckedChange={toggleDense}
                  />
                </div>
                {dense && (
                  <p className="text-xs text-muted-foreground">
                    {t('settings.denseModeShortcuts')}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy & Data tab — RODO / Legal Section */}
          <TabsContent value="privacy" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  {t('settings.privacy')}
                </CardTitle>
                <CardDescription>
                  {t('settings.privacyDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/legal/rodo">{t('settings.gdprCenter')}</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/legal/privacy">{t('settings.privacyPolicy')}</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/legal/cookies">{t('settings.cookiesPolicy')}</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/legal/terms">{t('settings.termsOfService')}</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/legal/dpa">{t('settings.dpa')}</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <CompanyDocuments />
          </TabsContent>

          {CALENDAR_SYNC_SETTINGS_VISIBLE && (
            <TabsContent value="calendar" className="mt-4">
              <CalendarSync />
            </TabsContent>
          )}

          {PUSH_NOTIFICATIONS_ENABLED && (
            <TabsContent value="notifications" className="mt-4">
              <PushNotificationSettings />
            </TabsContent>
          )}

          {BIOMETRIC_FEATURE_ENABLED && (
            <TabsContent value="biometric" className="mt-4">
              <BiometricSettings />
            </TabsContent>
          )}

          <TabsContent value="email" className="mt-4">
            <ContactEmailSettings />
          </TabsContent>

          {/* Subscription tab — PR-20: plan + status + manage billing */}
          <TabsContent value="subscription" className="mt-4">
            <SubscriptionSection />
          </TabsContent>

          {/* Account tab — delete account (GDPR Art. 17 + Apple App Store requirement) */}
          <TabsContent value="account" className="mt-4">
            <DeleteAccountSection />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
