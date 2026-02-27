import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, CreditCard, Zap, Users, HardDrive, FolderKanban, Star } from 'lucide-react';
import { useConfig } from '@/contexts/ConfigContext';
import { PlanRequestModal } from '@/components/billing/PlanRequestModal';
import { supabase } from '@/integrations/supabase/client';
import { formatDualCurrency } from '@/config/currency';

const STRIPE_ENABLED = import.meta.env.VITE_STRIPE_ENABLED === 'true';
const CONTACT_EMAIL = 'kontakt.majsterai@gmail.com';

/** Maps plan feature keys to billing i18n translation keys */
const PLAN_FEATURE_I18N_KEYS: Record<string, string> = {
  excelExport: 'billing.planFeature.excelExport',
  team: 'billing.planFeature.team',
  customTemplates: 'billing.planFeature.customTemplates',
  ai: 'billing.planFeature.ai',
  voice: 'billing.planFeature.voice',
  documents: 'billing.planFeature.documents',
  calendarSync: 'billing.planFeature.calendarSync',
  marketplace: 'billing.planFeature.marketplace',
  advancedAnalytics: 'billing.planFeature.advancedAnalytics',
  photoEstimation: 'billing.planFeature.photoEstimation',
  ocr: 'billing.planFeature.ocr',
  api: 'billing.planFeature.api',
  prioritySupport: 'billing.planFeature.prioritySupport',
  unlimitedProjects: 'billing.planFeature.unlimitedProjects',
  unlimitedClients: 'billing.planFeature.unlimitedClients',
};

/** Fallback English labels for plan features (used when i18n key missing) */
const PLAN_FEATURE_FALLBACKS: Record<string, string> = {
  excelExport: 'Excel Export',
  team: 'Team Management',
  customTemplates: 'Custom Templates',
  ai: 'AI Assistant',
  voice: 'Voice Dictation',
  documents: 'Company Documents',
  calendarSync: 'Calendar Sync',
  marketplace: 'Marketplace',
  advancedAnalytics: 'Advanced Analytics',
  photoEstimation: 'Photo Estimation',
  ocr: 'Invoice OCR',
  api: 'API Access',
  prioritySupport: 'Priority Support',
  unlimitedProjects: 'Unlimited Projects',
  unlimitedClients: 'Unlimited Clients',
};

function formatStorage(mb: number): string {
  if (mb >= 1024) return `${mb / 1024} GB`;
  return `${mb} MB`;
}

function formatLimit(value: number, t: (key: string, fallback: string) => string): string {
  if (value >= 9999) return t('billing.unlimited', 'Unlimited');
  return String(value);
}

export default function Plan() {
  const { config } = useConfig();
  const tiers = config.plans.tiers;
  const { t, i18n } = useTranslation();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ slug: string; name: string } | null>(null);

  async function handlePlanCta(tierSlug: string, tierName: string) {
    if (STRIPE_ENABLED) {
      // Stripe checkout path — wire up when Stripe account is ready
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const res = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ planSlug: tierSlug }),
      });
      if (res.ok) {
        const { url } = await res.json();
        if (url) window.location.href = url;
      }
    } else {
      setSelectedPlan({ slug: tierSlug, name: tierName });
      setModalOpen(true);
    }
  }

  return (
    <>
      <Helmet>
        <title>{t('billing.subscriptionAndPlan', 'Subscription & Plan')} | Majster.AI</title>
        <meta name="description" content={t('billing.subtitle', 'Manage your subscription plan')} />
      </Helmet>

      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm">
              <CreditCard className="h-5 w-5 text-primary-foreground" />
            </div>
            {t('billing.subscriptionAndPlan', 'Subscription & Plan')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('billing.planChooseSubtitle', 'Choose a plan that fits your business. Start free, scale when ready.')}
          </p>
        </div>

        {/* Current plan notice */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{t('billing.currentlyOnFreePlan', 'You are currently on the Free plan')}</p>
              <p className="text-xs text-muted-foreground">
                {t('billing.upgradeToUnlock', 'Upgrade to unlock AI, team management, and more.')}
              </p>
            </div>
            <Badge variant="secondary">{t('billing.plans.free.name', 'Free')}</Badge>
          </CardContent>
        </Card>

        {/* Plans grid */}
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {tiers.map((tier) => (
            <Card
              key={tier.id}
              className={`relative flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                tier.highlighted
                  ? 'border-primary shadow-md ring-2 ring-primary/20'
                  : 'border hover:border-primary/30'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="flex items-center gap-1 shadow-sm">
                    <Star className="h-3 w-3 fill-current" />
                    {t('billing.mostPopular', 'Most Popular')}
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4">
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">
                    {formatDualCurrency(tier.pricePLN, i18n.language)}
                  </span>
                  {tier.pricePLN > 0 && (
                    <span className="text-sm text-muted-foreground"> {t('billing.perMonth', '/month')}</span>
                  )}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col flex-1 gap-4">
                {/* Limits */}
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <FolderKanban className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>
                      <span className="font-medium">{formatLimit(tier.maxProjects, t)}</span>
                      {tier.maxProjects < 9999 ? ' ' + t('billing.limitProjects', 'projects') : ''}
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>
                      <span className="font-medium">{formatLimit(tier.maxClients, t)}</span>
                      {tier.maxClients < 9999 ? ' ' + t('billing.limitClients', 'clients') : ''}
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium">{formatStorage(tier.maxStorageMB)} {t('billing.storage', 'storage')}</span>
                  </li>
                  {tier.maxTeamMembers > 0 && (
                    <li className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>
                        <span className="font-medium">{formatLimit(tier.maxTeamMembers, t)}</span>
                        {tier.maxTeamMembers < 9999 ? ' ' + t('billing.limitTeam', 'team members') : ''}
                      </span>
                    </li>
                  )}
                </ul>

                {/* Features */}
                {tier.features.length > 0 && (
                  <ul className="space-y-1.5 text-sm border-t pt-3">
                    {tier.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                        <span>{t(PLAN_FEATURE_I18N_KEYS[feat] ?? feat, PLAN_FEATURE_FALLBACKS[feat] ?? feat)}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* CTA */}
                <div className="mt-auto pt-4">
                  {tier.pricePLN === 0 ? (
                    <Button variant="outline" className="w-full" disabled>
                      {t('billing.currentPlan', 'Current Plan')}
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={tier.highlighted ? 'default' : 'outline'}
                      onClick={() => handlePlanCta(tier.id, tier.name)}
                    >
                      {t('billing.selectPlan', 'Select plan')} {tier.name}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ / info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('billing.faqTitle', 'Payment Questions')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">{t('billing.faqQ1', 'How to change plan?')}</span>{' '}
              {t('billing.faqA1', 'Contact us by email')} {' '}
              <span className="font-medium text-foreground">{CONTACT_EMAIL}</span>{' '}
              {t('billing.faqA1b', 'or submit a request by clicking the button next to your chosen plan.')}
            </p>
            <p>
              <span className="font-medium text-foreground">{t('billing.faqQ2', 'Can I cancel?')}</span>{' '}
              {t('billing.faqA2', 'Yes — paid plans can be cancelled at any time. Access remains active until the end of the billing period.')}
            </p>
            <p>
              <span className="font-medium text-foreground">{t('billing.faqQ3', 'VAT invoices?')}</span>{' '}
              {t('billing.faqA3', 'Yes, we issue VAT invoices. Provide your company tax ID (NIP) when purchasing a plan.')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plan Request Modal */}
      {selectedPlan && (
        <PlanRequestModal
          open={modalOpen}
          planSlug={selectedPlan.slug}
          planName={selectedPlan.name}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
