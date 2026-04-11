import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, Bell, Globe, Calendar, FileText, Scale, Fingerprint, Mail, UserX, CreditCard, ShieldCheck, ChevronRight, ChevronLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useDenseMode } from '@/hooks/useDenseMode';
import { LanguageSwitcher } from '@/components/settings/LanguageSwitcher';
import { ContactEmailSettings } from '@/components/settings/ContactEmailSettings';
import { DeleteAccountSection } from '@/components/settings/DeleteAccountSection';
import { CalendarSync } from '@/components/calendar/CalendarSync';
import { CompanyDocuments } from '@/components/documents/CompanyDocuments';
import { PushNotificationSettings } from '@/components/notifications/PushNotificationSettings';
import { BiometricSettings } from '@/components/settings/BiometricSettings';
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
  /** Short description shown on mobile list */
  descKey?: string;
  /** Tailwind classes for icon background + color */
  iconStyle?: string;
}

const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: 'general',
    icon: Globe,
    labelKey: 'settings.language',
    descKey: 'settings.languageSelectDescription',
    iconStyle: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  {
    id: 'documents',
    icon: FileText,
    labelKey: 'settings.documents',
    descKey: 'settings.documentsDescription',
    iconStyle: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  },
  ...(CALENDAR_SYNC_SETTINGS_VISIBLE
    ? [{ id: 'calendar', icon: Calendar, labelKey: 'nav.calendar', iconStyle: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' } as SettingsSection]
    : []),
  {
    id: 'email',
    icon: Mail,
    labelKey: 'settings.contactEmailTab',
    iconStyle: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  {
    id: 'subscription',
    icon: CreditCard,
    labelKey: 'settings.subscriptionTab',
    iconStyle: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'privacy',
    icon: ShieldCheck,
    labelKey: 'settings.privacy',
    descKey: 'settings.privacyDescription',
    iconStyle: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  },
  {
    id: 'account',
    icon: UserX,
    labelKey: 'settings.accountTab',
    iconStyle: 'bg-red-500/10 text-red-600 dark:text-red-400',
  },
];

function SectionContent({
  sectionId,
  dense,
  toggleDense,
  t,
}: {
  sectionId: string;
  dense: boolean;
  toggleDense: () => void;
  t: (key: string) => string;
}) {
  switch (sectionId) {
    case 'general':
      return (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.language')}</CardTitle>
              <CardDescription>{t('settings.languageSelectDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('settings.language')}</Label>
                  <p className="text-sm text-muted-foreground">{t('settings.languageLabel')}</p>
                </div>
                <LanguageSwitcher />
              </div>
            </CardContent>
          </Card>

          {/* Dense Office Mode — P2, desktop only */}
          <Card className="hidden md:block">
            <CardHeader>
              <CardTitle>{t('settings.denseMode')}</CardTitle>
              <CardDescription>{t('settings.denseModeDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="dense-mode-toggle">{t('settings.denseMode')}</Label>
                <Switch id="dense-mode-toggle" checked={dense} onCheckedChange={toggleDense} />
              </div>
              {dense && (
                <p className="text-xs text-muted-foreground">{t('settings.denseModeShortcuts')}</p>
              )}
            </CardContent>
          </Card>
        </div>
      );

    case 'documents':
      return <CompanyDocuments />;

    case 'calendar':
      return <CalendarSync />;

    case 'email':
      return <ContactEmailSettings />;

    case 'subscription':
      return <SubscriptionSection />;

    case 'privacy':
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              {t('settings.privacy')}
            </CardTitle>
            <CardDescription>{t('settings.privacyDescription')}</CardDescription>
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
      );

    case 'account':
      return <DeleteAccountSection />;

    default:
      return null;
  }
}

export default function Settings() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('general');
  /**
   * Mobile two-level navigation state.
   * null  → show section list (top level)
   * string → show that section's content with back button
   */
  const [mobileSection, setMobileSection] = useState<string | null>(null);
  const { dense, toggleDense } = useDenseMode();

  const activeSectionMeta = SETTINGS_SECTIONS.find((s) => s.id === mobileSection);

  return (
    <>
      <Helmet>
        <title>{t('settings.title')} | Majster.AI</title>
        <meta name="description" content={t('settings.subtitle')} />
      </Helmet>

      <div className="space-y-6 animate-fade-in">
        {/* ── MOBILE: hide page header when drill-down is open ── */}
        <div className={cn(mobileSection !== null && 'sm:block hidden')}>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <SettingsIcon className="h-6 w-6" />
            {t('settings.title')}
          </h1>
          <p className="text-muted-foreground">{t('settings.subtitle')}</p>
        </div>

        {/* ══════════════════════════════════════════
            MOBILE — two-level navigation (iOS-style)
            ══════════════════════════════════════════ */}

        {/* Level 1: Section list */}
        {mobileSection === null && (
          <nav className="sm:hidden space-y-1.5" aria-label={t('settings.title')}>
            {SETTINGS_SECTIONS.map(({ id, icon: Icon, labelKey, descKey, iconStyle }) => (
              <button
                key={id}
                type="button"
                onClick={() => setMobileSection(id)}
                data-testid={`settings-mobile-nav-${id}`}
                className="w-full flex items-center gap-3 rounded-xl px-4 py-3.5 text-left bg-card border border-border/60 shadow-sm hover:bg-muted/50 active:scale-[0.99] transition-all duration-150"
              >
                <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', iconStyle || 'bg-muted')}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-foreground">{t(labelKey)}</span>
                  {descKey && (
                    <span className="block text-xs text-muted-foreground truncate">{t(descKey)}</span>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </nav>
        )}

        {/* Level 2: Section content with back button */}
        {mobileSection !== null && (
          <div className="sm:hidden space-y-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileSection(null)}
                className="flex items-center gap-1 text-sm font-medium text-primary hover:opacity-80 active:opacity-60 transition-opacity -ml-1 py-1 pr-2"
                aria-label={t('settings.title')}
              >
                <ChevronLeft className="h-5 w-5" />
                {t('settings.title')}
              </button>
            </div>

            {activeSectionMeta && (
              <div className="flex items-center gap-3 pb-2 border-b border-border/60">
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', activeSectionMeta.iconStyle || 'bg-muted')}>
                  <activeSectionMeta.icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{t(activeSectionMeta.labelKey)}</h2>
                  {activeSectionMeta.descKey && (
                    <p className="text-sm text-muted-foreground">{t(activeSectionMeta.descKey)}</p>
                  )}
                </div>
              </div>
            )}

            <SectionContent sectionId={mobileSection} dense={dense} toggleDense={toggleDense} t={t} />
          </div>
        )}

        {/* ══════════════════════════════════════════
            DESKTOP — horizontal tabs (sm+)
            ══════════════════════════════════════════ */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden sm:block">
          <div className="overflow-x-auto -mx-1 px-1">
            <TabsList className="inline-flex h-auto min-w-full gap-1 p-1">
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

          <TabsContent value="general" className="mt-4">
            <SectionContent sectionId="general" dense={dense} toggleDense={toggleDense} t={t} />
          </TabsContent>
          <TabsContent value="documents" className="mt-4">
            <SectionContent sectionId="documents" dense={dense} toggleDense={toggleDense} t={t} />
          </TabsContent>
          {CALENDAR_SYNC_SETTINGS_VISIBLE && (
            <TabsContent value="calendar" className="mt-4">
              <SectionContent sectionId="calendar" dense={dense} toggleDense={toggleDense} t={t} />
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
            <SectionContent sectionId="email" dense={dense} toggleDense={toggleDense} t={t} />
          </TabsContent>
          <TabsContent value="subscription" className="mt-4">
            <SectionContent sectionId="subscription" dense={dense} toggleDense={toggleDense} t={t} />
          </TabsContent>
          <TabsContent value="privacy" className="mt-4">
            <SectionContent sectionId="privacy" dense={dense} toggleDense={toggleDense} t={t} />
          </TabsContent>
          <TabsContent value="account" className="mt-4">
            <SectionContent sectionId="account" dense={dense} toggleDense={toggleDense} t={t} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
