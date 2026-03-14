import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2 } from 'lucide-react';
import type { OnboardingProgress } from '@/hooks/useOnboarding';
import { ONBOARDING_STEPS } from '@/hooks/useOnboarding';

interface DashboardOnboardingProgressProps {
  progress: OnboardingProgress;
}

/**
 * Compact progress bar showing onboarding completion percentage.
 * Only shown when onboarding is in progress (not completed, not skipped).
 * Uses existing onboarding data — no additional DB queries.
 */
export function DashboardOnboardingProgress({ progress }: DashboardOnboardingProgressProps) {
  const { t } = useTranslation();

  if (progress.is_completed || progress.skipped_at) return null;

  const completedCount = progress.completed_steps.length;
  const totalSteps = ONBOARDING_STEPS.length;
  const percent = Math.round((completedCount / totalSteps) * 100);

  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted/40 px-4 py-2.5 text-sm">
      <div className="flex items-center gap-1.5 shrink-0">
        <CheckCircle2 className="h-4 w-4 text-primary" />
        <span className="font-medium text-foreground">
          {t('dashboard.profileProgress.label')}
        </span>
      </div>
      <Progress value={percent} className="h-1.5 flex-1 max-w-[120px]" />
      <span className="text-xs text-muted-foreground tabular-nums shrink-0">
        {percent}%
      </span>
    </div>
  );
}
