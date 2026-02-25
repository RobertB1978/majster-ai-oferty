import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useOnboardingProgress, useCreateOnboardingProgress } from '@/hooks/useOnboarding';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles, AlertTriangle, Clock } from 'lucide-react';
import { EmptyDashboard } from '@/components/dashboard/EmptyDashboard';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { ProjectStatusBreakdown } from '@/components/dashboard/ProjectStatusBreakdown';
import { RecentProjects } from '@/components/dashboard/RecentProjects';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { QuoteCreationHub } from '@/components/dashboard/QuoteCreationHub';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdBanner } from '@/components/ads/AdBanner';
import { usePlanFeatures } from '@/hooks/useSubscription';
import { useExpirationMonitor } from '@/hooks/useExpirationMonitor';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TrialBanner } from '@/components/billing/TrialBanner';
import { DashboardSkeleton } from '@/components/ui/skeleton-screens';

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

  // Handle voice quote creation
  const handleVoiceQuoteCreated = (result: unknown) => {
    navigate('/app/jobs/new', { state: { voiceQuote: result } });
  };

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
    const badges = {
      free: { label: 'Free', className: 'bg-muted text-muted-foreground' },
      starter: { label: 'Starter', className: 'bg-blue-500/20 text-blue-500' },
      business: { label: 'Business', className: 'bg-purple-500/20 text-purple-500' },
      enterprise: { label: 'Enterprise', className: 'bg-primary/20 text-primary' },
    };
    return badges[currentPlan] || badges.free;
  };

  const planBadge = getPlanBadge();

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Background mesh gradient */}
      <div className="fixed inset-0 bg-mesh-gradient pointer-events-none opacity-30" />
      
      {/* Trial countdown banner */}
      <TrialBanner />

      {/* Ad Banner for Free users */}
      {showAds && (
        <AdBanner variant="inline" className="mb-2" />
      )}

      {/* Expiration Alerts */}
      {(expiringOffersCount > 0 || isSubscriptionExpiring) && (
        <div className="space-y-3">
          {expiringOffersCount > 0 && (
            <Alert variant="destructive" className="border-warning bg-warning/10">
              <Clock className="h-4 w-4" />
              <AlertTitle>{t('dashboard.expiringOffersTitle')}</AlertTitle>
              <AlertDescription>
                {t('dashboard.expiringOffersDesc', { count: expiringOffersCount })}
                <Button variant="link" className="p-0 ml-1 h-auto" onClick={() => navigate('/app/jobs')}>
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

      {/* Header */}
      <div className="relative rounded-2xl bg-primary/5 border border-primary/20 p-6 overflow-hidden">
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
          </div>
          <Button 
            size="lg" 
            onClick={() => navigate('/app/jobs/new')} 
            className="shadow-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200"
          >
            <Plus className="mr-2 h-5 w-5" />
            {t('dashboard.newProject')}
          </Button>
        </div>
      </div>

      {/* Quote Creation Hub - Main Feature */}
      <Card className="border-2 border-primary/20 bg-primary/5 overflow-hidden shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <QuoteCreationHub onVoiceQuoteCreated={handleVoiceQuoteCreated} />
        </CardContent>
      </Card>

      {/* Main Stats */}
      <DashboardStats
        projectsCount={totalProjects}
        clientsCount={totalClients}
        acceptedCount={acceptedCount}
        recentCount={recentWeekCount}
      />

      {/* Sidebar Ad for Free users */}
      {showAds && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <ProjectStatusBreakdown
              newCount={newCount}
              inProgressCount={inProgressCount}
              sentCount={sentCount}
              acceptedCount={acceptedCount}
            />
          </div>
          <div className="lg:col-span-1">
            <AdBanner variant="vertical" showClose={false} />
          </div>
        </div>
      )}

      {/* Status breakdown without ads */}
      {!showAds && (
        <ProjectStatusBreakdown
          newCount={newCount}
          inProgressCount={inProgressCount}
          sentCount={sentCount}
          acceptedCount={acceptedCount}
        />
      )}

      {/* Quick Actions */}
      <QuickActions />

      {/* Recent projects */}
      <RecentProjects projects={recentProjects} isLoading={isLoading} />

      {/* Bottom Ad for Free users */}
      {showAds && (
        <AdBanner variant="horizontal" />
      )}

      {/* Onboarding wizard */}
      <OnboardingWizard 
        open={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
      />
    </div>
  );
}
