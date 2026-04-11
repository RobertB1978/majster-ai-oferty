import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, Globe, FileText, Scale, Mail, UserX, CreditCard, ShieldCheck, ChevronRight, ChevronLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useDenseMode } from '@/hooks/useDenseMode';
import { LanguageSwitcher } from '@/components/settings/LanguageSwitcher';
import { ContactEmailSettings } from '@/components/settings/ContactEmailSettings';
import { DeleteAccountSection } from '@/components/settings/DeleteAccountSection';
import { CompanyDocuments } from '@/components/documents/CompanyDocuments';
import { SubscriptionSection } from '@/components/billing/SubscriptionSection';

interface SettingsSection {
  id: string;
  icon: React.ElementType;
  labelKey: string;
  /** Short description shown on mobile list */
  descKey?: string;
  /** DS semantic classes for icon background + color */
  iconStyle?: string;
}

const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: 'general',
    icon: Globe,
    labelKey: 'settings.language',
    descKey: 'settings.languageSelectDescription',
    iconStyle: 'bg-info/10 text-info dark:bg-info/20',
  },
  {
    id: 'documents',
    icon: FileText,
    labelKey: 'settings.documents',
    descKey: 'settings.documentsDescription',
    iconStyle: 'bg-primary/10 text-primary dark:bg-primary/20',
  },
  {
    id: 'email',
    icon: Mail,
    labelKey: 'settings.contactEmailTab',
    iconStyle: 'bg-warning/10 text-warning dark:bg-warning/20',
  },
  {
    id: 'subscription',
    icon: CreditCard,
    labelKey: 'settings.subscriptionTab',
    iconStyle: 'bg-success/10 text-success dark:bg-success/20',
  },
  {
    id: 'privacy',
    icon: ShieldCheck,
    labelKey: 'settings.privacy',
    descKey: 'settings.privacyDescription',
    iconStyle: 'bg-muted text-muted-foreground',
  },
  {
    id: 'account',
    icon: UserX,
    labelKey: 'settings.accountTab',
    iconStyle: 'bg-destructive/10 text-destructive dark:bg-destructive/20',
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
        {/*
          Uses DS <Button variant="outline"> instead of raw <button>. The Button
          base styles auto-size any descendant SVG to 16px via [&_svg]:size-4,
          so we override with [&>div>svg]:!size-5 for the category icon inside
          the 36x36 wrapper (keeps the original visual weight). The trailing
          ChevronRight keeps the default 16px.
        */}
        {mobileSection === null && (
          <nav className="sm:hidden space-y-1.5" aria-label={t('settings.title')}>
            {SETTINGS_SECTIONS.map(({ id, icon: Icon, labelKey, descKey, iconStyle }) => (
              <Button
                key={id}
                type="button"
                variant="outline"
                onClick={() => setMobileSection(id)}
                data-testid={`settings-mobile-nav-${id}`}
                className="w-full h-auto justify-start items-center gap-3 rounded-xl px-4 py-3.5 text-left bg-card border-border/60 shadow-sm hover:bg-muted/50 active:scale-[0.99] transition-all duration-150 [&>div>svg]:!size-5"
              >
                <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', iconStyle || 'bg-muted')}>
                  <Icon />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-foreground">{t(labelKey)}</span>
                  {descKey && (
                    <span className="block text-xs text-muted-foreground truncate font-normal">{t(descKey)}</span>
                  )}
                </div>
                <ChevronRight className="text-muted-foreground shrink-0" />
              </Button>
            ))}
          </nav>
        )}

        {/* Level 2: Section content with back button */}
        {mobileSection !== null && (
          <div className="sm:hidden space-y-4">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setMobileSection(null)}
                className="-ml-2 h-auto gap-1 px-2 py-1 text-sm font-medium text-primary hover:bg-transparent hover:opacity-80"
                aria-label={t('settings.title')}
              >
                <ChevronLeft />
                {t('settings.title')}
              </Button>
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
