import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useOnboardingProgress, useCreateOnboardingProgress } from '@/hooks/useOnboarding';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles, AlertTriangle, Clock, Package } from 'lucide-react';
// Clock retained for expiration alert icon above
import { EmptyDashboard } from '@/components/dashboard/EmptyDashboard';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { ProjectStatusDonut } from '@/components/dashboard/ProjectStatusDonut';
import { DashboardRevenueChart } from '@/components/dashboard/DashboardRevenueChart';
import { DashboardOffersChart } from '@/components/dashboard/DashboardOffersChart';
import { RecentProjects } from '@/components/dashboard/RecentProjects';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { QuoteCreationHub } from '@/components/dashboard/QuoteCreationHub';
import { DashboardNextStep } from '@/components/dashboard/DashboardNextStep';
import { DashboardOnboardingProgress } from '@/components/dashboard/DashboardOnboardingProgress';
import { DashboardTrustBar } from '@/components/dashboard/DashboardTrustBar';
import { Badge } from '@/components/ui/badge';
import { AdBanner } from '@/components/ads/AdBanner';
import { usePlanFeatures } from '@/hooks/useSubscription';
import { useExpirationMonitor } from '@/hooks/useExpirationMonitor';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TrialBanner } from '@/components/billing/TrialBanner';
import { DashboardSkeleton } from '@/components/ui/skeleton-screens';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { TodayTasks } from '@/components/dashboard/TodayTasks';

export default function Dashboard() {
  const { t } = useTranslation();
  // Optimized: Single hook with server-side aggregations
  const {
    totalProjects,
    totalClients,
    newCount,
    inProgressCount,
    sentCount,
    acceptedCount,
    recentWeekCount,
    recentProjects,
    isLoading,
  } = useDashboardStats();

  const { data: onboardingProgress, isLoading: onboardingLoading } = useOnboardingProgress();
  const createOnboarding = useCreateOnboardingProgress();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { showAds, currentPlan } = usePlanFeatures();
  const { expiringOffersCount, subscriptionExpiresIn, isSubscriptionExpiring } = useExpirationMonitor();

  // Initialize onboarding for new users
  useEffect(() => {
    if (!onboardingLoading && !onboardingProgress && totalProjects === 0 && totalClients === 0) {
      createOnboarding.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- createOnboarding is a mutation object; adding it causes infinite re-renders
  }, [onboardingLoading, onboardingProgress, totalProjects, totalClients]);

  // Show onboarding wizard for new users
  useEffect(() => {
    if (onboardingProgress && !onboardingProgress.is_completed && !onboardingProgress.skipped_at) {
      setShowOnboarding(true);
    }
  }, [onboardingProgress]);


  // Show skeleton while data is loading
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Show empty state for new users
  if (!isLoading && totalProjects === 0 && totalClients === 0) {
    return (
      <>
        <EmptyDashboard />
        <OnboardingWizard
          open={showOnboarding}
          onClose={() => setShowOnboarding(false)}
        />
      </>
    );
  }

  const getPlanBadge = () => {
    const badges: Record<string, { label: string; className: string }> = {
      free: { label: 'Free', className: 'bg-muted text-muted-foreground' },
      // 'starter' is a legacy alias for 'pro' — display identically.
      starter: { label: 'Pro', className: 'bg-success/15 text-success' },
      pro: { label: 'Pro', className: 'bg-success/15 text-success' },
      business: { label: 'Business', className: 'bg-warning/15 text-warning' },
      enterprise: { label: 'Enterprise', className: 'bg-primary/20 text-primary' },
    };
    return badges[currentPlan] ?? badges.free;
  };

  const planBadge = getPlanBadge();

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Background mesh gradient */}
      <div className="fixed inset-0 bg-mesh-gradient pointer-events-none opacity-30" />

      {/* === ABOVE THE FOLD === */}

      {/* Expiration Alerts — critical, always visible */}
      {(expiringOffersCount > 0 || isSubscriptionExpiring) && (
        <div className="space-y-3">
          {expiringOffersCount > 0 && (
            <Alert variant="destructive" className="border-warning bg-warning/10">
              <Clock className="h-4 w-4" />
              <AlertTitle>{t('dashboard.expiringOffersTitle')}</AlertTitle>
              <AlertDescription>
                {t('dashboard.expiringOffersDesc', { count: expiringOffersCount })}
                <Button variant="link" className="p-0 ml-1 h-auto" onClick={() => navigate('/app/projects')}>
                  {t('dashboard.viewDetails')}
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {isSubscriptionExpiring && subscriptionExpiresIn !== null && (
            <Alert variant="destructive" className="border-destructive bg-destructive/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t('dashboard.subscriptionExpiringSoonTitle')}</AlertTitle>
              <AlertDescription>
                {t('dashboard.subscriptionExpiresInDays', { days: subscriptionExpiresIn })}
                <Button variant="link" className="p-0 ml-1 h-auto" onClick={() => navigate('/app/settings')}>
                  {t('dashboard.checkSettings')}
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Header — main CTA */}
      <div className="relative rounded-2xl bg-gradient-to-br from-primary/10 to-primary/4 border border-primary/25 p-6 overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                {t('dashboard.welcome')}
              </h1>
              <Badge
                variant="secondary"
                className={`text-xs font-semibold ${planBadge.className} shadow-sm`}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                {planBadge.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {t('dashboard.tagline')}
            </p>
            {/* Profile setup progress — shown only during onboarding */}
            {onboardingProgress && !onboardingProgress.is_completed && !onboardingProgress.skipped_at && (
              <div className="mt-2">
                <DashboardOnboardingProgress progress={onboardingProgress} />
              </div>
            )}
          </div>
          <Button
            size="lg"
            onClick={() => navigate('/app/offers/new')}
            className="shadow-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200"
          >
            <Plus className="mr-2 h-5 w-5" />
            {t('dashboard.mainCta')}
          </Button>
        </div>
      </div>

      {/* Trade onboarding + starter packs — explicit fast-path for new users */}
      <div className="rounded-xl border bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              {t('dashboard.starterPacksTitle')}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {t('dashboard.starterPacksSubtitle')}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/app/szybka-wycena')}
          >
            {t('dashboard.starterPacksCta')}
          </Button>
        </div>
      </div>

      {/* Next onboarding step — inline guidance for in-progress users */}
      {onboardingProgress && !onboardingProgress.is_completed && !onboardingProgress.skipped_at && (
        <DashboardNextStep
          progress={onboardingProgress}
          onOpenWizard={() => setShowOnboarding(true)}
        />
      )}

      {/* Today's tasks — actionable items first */}
      <TodayTasks />

      {/* Quick Actions */}
      <QuickActions />

      {/* Recent projects — most relevant content above fold */}
      <RecentProjects projects={recentProjects} isLoading={isLoading} />

      {/* === BELOW THE FOLD === */}

      {/* Main Stats — summary first, then activity narrative */}
      <DashboardStats
        projectsCount={totalProjects}
        clientsCount={totalClients}
        acceptedCount={acceptedCount}
        recentCount={recentWeekCount}
      />

      {/* Charts row — RevenueChart (2/3) + ProjectStatusDonut (1/3) per roadmap §4.1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashboardRevenueChart />
        </div>
        <div className="lg:col-span-1">
          <ProjectStatusDonut
            newCount={newCount}
            inProgressCount={inProgressCount}
            sentCount={sentCount}
            acceptedCount={acceptedCount}
          />
        </div>
      </div>

      {/* OffersBarChart (1/2) + ActivityFeed (1/2) per roadmap §4.1 */}
      {showAds ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-2">
            <DashboardOffersChart
              newCount={newCount}
              inProgressCount={inProgressCount}
              sentCount={sentCount}
              acceptedCount={acceptedCount}
            />
          </div>
          <div className="lg:col-span-1">
            <ActivityFeed />
          </div>
          <div className="lg:col-span-1">
            <AdBanner variant="vertical" showClose={false} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardOffersChart
            newCount={newCount}
            inProgressCount={inProgressCount}
            sentCount={sentCount}
            acceptedCount={acceptedCount}
          />
          <ActivityFeed />
        </div>
      )}

      {/* Quote Creation Hub — secondary entry point for voice/AI/manual modes */}
      <div className="border rounded-lg p-4 sm:p-6 bg-muted/30">
        <QuoteCreationHub />
      </div>

      {/* Trust signals — subtle confidence cues */}
      <DashboardTrustBar />

      {/* Trial countdown banner — upsell, below fold */}
      <TrialBanner />

      {/* Ad Banner for Free users — one banner, at the bottom */}
      {showAds && <AdBanner variant="horizontal" />}

      {/* Onboarding wizard */}
      <OnboardingWizard
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </div>
  );
}
