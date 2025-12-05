import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { useClients } from '@/hooks/useClients';
import { useOnboardingProgress, useCreateOnboardingProgress } from '@/hooks/useOnboarding';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { EmptyDashboard } from '@/components/dashboard/EmptyDashboard';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { ProjectStatusBreakdown } from '@/components/dashboard/ProjectStatusBreakdown';
import { RecentProjects } from '@/components/dashboard/RecentProjects';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

export default function Dashboard() {
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { data: onboardingProgress, isLoading: onboardingLoading } = useOnboardingProgress();
  const createOnboarding = useCreateOnboardingProgress();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const isLoading = projectsLoading || clientsLoading;

  // Statistics
  const stats = {
    total: projects.length,
    new: projects.filter(p => p.status === 'Nowy').length,
    inProgress: projects.filter(p => p.status === 'Wycena w toku').length,
    sent: projects.filter(p => p.status === 'Oferta wysłana').length,
    accepted: projects.filter(p => p.status === 'Zaakceptowany').length,
  };

  // Projects from last week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const recentCount = projects.filter(p => new Date(p.created_at) > oneWeekAgo).length;

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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Witaj w Majster.AI
          </h1>
          <p className="mt-1 text-muted-foreground">
            Panel główny - przegląd projektów i szybkie akcje
          </p>
        </div>
        <Button size="lg" onClick={() => navigate('/projects/new')} className="shadow-md">
          <Plus className="mr-2 h-5 w-5" />
          Nowy projekt
        </Button>
      </div>

      {/* Main Stats */}
      <DashboardStats
        projectsCount={stats.total}
        clientsCount={clients.length}
        acceptedCount={stats.accepted}
        recentCount={recentCount}
      />

      {/* Status breakdown */}
      <ProjectStatusBreakdown
        newCount={stats.new}
        inProgressCount={stats.inProgress}
        sentCount={stats.sent}
        acceptedCount={stats.accepted}
      />

      {/* Quick Actions */}
      <QuickActions />

      {/* Recent projects */}
      <RecentProjects projects={recentProjects} isLoading={isLoading} />

      {/* Onboarding wizard */}
      <OnboardingWizard 
        open={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
      />
    </div>
  );
}
