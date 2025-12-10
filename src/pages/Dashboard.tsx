import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { useClients } from '@/hooks/useClients';
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

export default function Dashboard() {
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { data: onboardingProgress, isLoading: onboardingLoading } = useOnboardingProgress();
  const createOnboarding = useCreateOnboardingProgress();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { showAds, currentPlan } = usePlanFeatures();
  const { expiringOffersCount, subscriptionExpiresIn, isSubscriptionExpiring } = useExpirationMonitor();

  const recentProjects = useMemo(() =>
    [...projects]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5),
    [projects]
  );

  const isLoading = projectsLoading || clientsLoading;

  // Statistics
  const stats = useMemo(() => ({
    total: projects.length,
    new: projects.filter(p => p.status === 'Nowy').length,
    inProgress: projects.filter(p => p.status === 'Wycena w toku').length,
    sent: projects.filter(p => p.status === 'Oferta wysłana').length,
    accepted: projects.filter(p => p.status === 'Zaakceptowany').length,
  }), [projects]);

  // Projects from last week
  const recentCount = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return projects.filter(p => new Date(p.created_at) > oneWeekAgo).length;
  }, [projects]);

  // Initialize onboarding for new users
  useEffect(() => {
    if (!onboardingLoading && !onboardingProgress && projects.length === 0 && clients.length === 0) {
      createOnboarding.mutate();
    }
  }, [onboardingLoading, onboardingProgress, projects.length, clients.length]);

  // Show onboarding wizard for new users
  useEffect(() => {
    if (onboardingProgress && !onboardingProgress.is_completed && !onboardingProgress.skipped_at) {
      setShowOnboarding(true);
    }
  }, [onboardingProgress]);

  // Handle voice quote creation
  const handleVoiceQuoteCreated = (result: any) => {
    navigate('/projects/new', { state: { voiceQuote: result } });
  };

  // Show empty state for new users
  if (!isLoading && projects.length === 0 && clients.length === 0) {
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
              <AlertTitle>Wygasające oferty</AlertTitle>
              <AlertDescription>
                Masz {expiringOffersCount} {expiringOffersCount === 1 ? 'ofertę wygasającą' : 'ofert wygasających'} w ciągu 7 dni. 
                <Button variant="link" className="p-0 ml-1 h-auto" onClick={() => navigate('/projects')}>
                  Zobacz szczegóły
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {isSubscriptionExpiring && subscriptionExpiresIn !== null && (
            <Alert variant="destructive" className="border-destructive bg-destructive/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Plan wkrótce wygasa</AlertTitle>
              <AlertDescription>
                Twój plan wygasa za {subscriptionExpiresIn} dni. 
                <Button variant="link" className="p-0 ml-1 h-auto" onClick={() => navigate('/billing')}>
                  Odnów teraz
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Header with gradient background */}
      <div className="relative rounded-2xl bg-gradient-to-r from-primary/10 via-purple-500/5 to-pink-500/10 p-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                Witaj w Majster.AI
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
              Panel główny - przegląd projektów i szybkie akcje
            </p>
          </div>
          <Button 
            size="lg" 
            onClick={() => navigate('/projects/new')} 
            className="shadow-xl bg-gradient-to-r from-primary via-purple-500 to-pink-500 hover:shadow-2xl hover:shadow-primary/30 hover:scale-105 transition-all duration-300"
          >
            <Plus className="mr-2 h-5 w-5" />
            Nowy projekt
          </Button>
        </div>
      </div>

      {/* Quote Creation Hub - Main Feature */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 overflow-hidden shadow-lg">
        <CardContent className="p-6 sm:p-8">
          <QuoteCreationHub onVoiceQuoteCreated={handleVoiceQuoteCreated} />
        </CardContent>
      </Card>

      {/* Main Stats */}
      <DashboardStats
        projectsCount={stats.total}
        clientsCount={clients.length}
        acceptedCount={stats.accepted}
        recentCount={recentCount}
      />

      {/* Sidebar Ad for Free users */}
      {showAds && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <ProjectStatusBreakdown
              newCount={stats.new}
              inProgressCount={stats.inProgress}
              sentCount={stats.sent}
              acceptedCount={stats.accepted}
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
          newCount={stats.new}
          inProgressCount={stats.inProgress}
          sentCount={stats.sent}
          acceptedCount={stats.accepted}
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
