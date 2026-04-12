import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, Globe, FileText, Scale, Mail, UserX, CreditCard, ShieldCheck, ChevronRight } from 'lucide-react';
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
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

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
   * Mobile section panel state.
   * null   → Sheet closed, section list visible
   * string → Sheet open, showing that section's content
   *
   * lastMobileSectionRef keeps the previous value alive for the 200ms Sheet
   * close animation so content doesn't flash to the fallback state mid-slide.
   */
  const [mobileSection, setMobileSection] = useState<string | null>(null);
  const lastMobileSectionRef = useRef<string | null>(null);
  const { dense, toggleDense } = useDenseMode();

  const openMobileSection = (id: string) => {
    lastMobileSectionRef.current = id;
    setMobileSection(id);
  };

  // Resolves to the open section, or the last known one during close animation
  const activeSectionMeta = SETTINGS_SECTIONS.find(
    (s) => s.id === (mobileSection ?? lastMobileSectionRef.current),
  );

  return (
    <>
      <Helmet>
        <title>{t('settings.title')} | Majster.AI</title>
        <meta name="description" content={t('settings.subtitle')} />
      </Helmet>

      <div className="space-y-6 animate-fade-in">
        {/* Page header — always visible */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2">
            <SettingsIcon className="h-6 w-6" />
            {t('settings.title')}
          </h1>
          <p className="text-muted-foreground">{t('settings.subtitle')}</p>
        </div>

        {/* ══════════════════════════════════════════
            MOBILE — section list (always visible)
            Tap a row → opens the section Sheet panel
            ══════════════════════════════════════════ */}
        {/*
          Uses DS <Button variant="outline"> instead of raw <button>. The Button
          base styles auto-size any descendant SVG to 16px via [&_svg]:size-4,
          so we override with [&>div>svg]:!size-5 for the category icon inside
          the 36x36 wrapper (keeps the original visual weight). The trailing
          ChevronRight keeps the default 16px.
        */}
        <nav className="sm:hidden space-y-1.5" aria-label={t('settings.title')}>
          {SETTINGS_SECTIONS.map(({ id, icon: Icon, labelKey, descKey, iconStyle }) => (
            <Button
              key={id}
              type="button"
              variant="outline"
              onClick={() => openMobileSection(id)}
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

        {/* ══════════════════════════════════════════
            MOBILE — section Sheet panel (DS pattern)
            Slides in from the right; close via X or
            backdrop tap. ScrollArea handles long content.
            ══════════════════════════════════════════ */}
        <Sheet open={mobileSection !== null} onOpenChange={(open) => { if (!open) setMobileSection(null); }}>
          <SheetContent side="right" className="flex flex-col p-0">
            {/* Panel header with section icon and title */}
            <div className="flex items-center gap-3 px-4 pt-5 pb-4 pr-12 border-b border-border/60">
              {activeSectionMeta && (
                <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', activeSectionMeta.iconStyle || 'bg-muted')}>
                  <activeSectionMeta.icon className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-base leading-tight">
                  {activeSectionMeta ? t(activeSectionMeta.labelKey) : t('settings.title')}
                </SheetTitle>
                {activeSectionMeta?.descKey && (
                  <SheetDescription className="text-xs mt-0.5 leading-snug">
                    {t(activeSectionMeta.descKey)}
                  </SheetDescription>
                )}
              </div>
            </div>

            {/* Scrollable section content */}
            <ScrollArea className="flex-1">
              <div className="p-4">
                {mobileSection && (
                  <SectionContent sectionId={mobileSection} dense={dense} toggleDense={toggleDense} t={t} />
                )}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>

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
