import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  Users,
  FolderOpen,
  FileText,
  Download,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { OnboardingProgress } from '@/hooks/useOnboarding';
import { ONBOARDING_STEPS } from '@/hooks/useOnboarding';
import type { LucideIcon } from 'lucide-react';

const stepIcons: LucideIcon[] = [Building2, Users, FolderOpen, FileText, Download];

const STEP_ROUTES: Record<number, string> = {
  1: '/app/profile',
  2: '/app/customers',
  3: '/app/offers/new',
  4: '/app/offers',
  5: '/app/offers',
};

interface DashboardNextStepProps {
  progress: OnboardingProgress;
  onOpenWizard: () => void;
}

export function DashboardNextStep({ progress, onOpenWizard }: DashboardNextStepProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const completedCount = progress.completed_steps.length;
  const progressPercent = (completedCount / ONBOARDING_STEPS.length) * 100;

  // Find next incomplete step
  const nextStep = ONBOARDING_STEPS.find(
    (s) => !progress.completed_steps.includes(s.id)
  );

  if (!nextStep || progress.is_completed || progress.skipped_at) return null;

  const nextStepIndex = nextStep.id - 1;
  const NextIcon = stepIcons[nextStepIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-sm"
    >
      <div className="flex items-start gap-4">
        {/* Step icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <NextIcon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-primary mb-0.5">
            {t('dashboard.nextStep.label', { current: nextStep.id, total: ONBOARDING_STEPS.length })}
          </p>
          <p className="font-semibold text-foreground text-sm">
            {t(nextStep.titleKey)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t(nextStep.descriptionKey)}
          </p>

          {/* Progress bar */}
          <div className="flex items-center gap-3 mt-3">
            <Progress value={progressPercent} className="h-1.5 flex-1" />
            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
              {Array.from({ length: ONBOARDING_STEPS.length }).map((_, i) => (
                <span key={i}>
                  {progress.completed_steps.includes(i + 1) ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <span className={`inline-block h-2 w-2 rounded-full ${i + 1 === nextStep.id ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <Button
            size="sm"
            onClick={() => navigate(STEP_ROUTES[nextStep.id])}
          >
            {t('onboarding.continueStep')}
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs h-7"
            onClick={onOpenWizard}
          >
            {t('dashboard.nextStep.viewAll')}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
