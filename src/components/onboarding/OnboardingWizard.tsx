import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  Users,
  FolderOpen,
  FileText,
  Download,
  CheckCircle2,
  ArrowRight,
  X,
  Sparkles,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  useOnboardingProgress,
  useSkipOnboarding,
  ONBOARDING_STEPS
} from '@/hooks/useOnboarding';

const stepIcons = [Building2, Users, FolderOpen, FileText, Download];

/** Approximate time in minutes per step — based on real product flows */
const STEP_TIME_MINUTES = [2, 1, 3, 1, 1];

/** Lightweight confetti-style celebration particles using Framer Motion */
function CelebrationParticles() {
  // Deterministic particle positions — no randomness, no layout shift
  const particles = [
    { x: -60, y: -80, rotate: 45, delay: 0, color: 'bg-success' },
    { x: 70, y: -70, rotate: -30, delay: 0.1, color: 'bg-primary' },
    { x: -40, y: -100, rotate: 60, delay: 0.15, color: 'bg-warning' },
    { x: 50, y: -90, rotate: -45, delay: 0.05, color: 'bg-success' },
    { x: -80, y: -50, rotate: 30, delay: 0.2, color: 'bg-primary' },
    { x: 80, y: -60, rotate: -60, delay: 0.12, color: 'bg-warning' },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className={`absolute left-1/2 top-1/2 h-2 w-2 rounded-full ${p.color}`}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
          animate={{
            x: p.x,
            y: p.y,
            opacity: [1, 1, 0],
            scale: [0, 1.2, 0.6],
            rotate: p.rotate,
          }}
          transition={{ duration: 1.2, delay: p.delay, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </div>
  );
}

interface OnboardingWizardProps {
  open: boolean;
  onClose: () => void;
}

export function OnboardingWizard({ open, onClose }: OnboardingWizardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: progress, isLoading } = useOnboardingProgress();
  const skipOnboarding = useSkipOnboarding();

  const completedCount = progress?.completed_steps.length ?? 0;
  const progressPercent = (completedCount / ONBOARDING_STEPS.length) * 100;
  const isAllDone = completedCount === ONBOARDING_STEPS.length;

  // Find the first incomplete step to recommend
  const nextStepId = ONBOARDING_STEPS.find(
    (s) => !progress?.completed_steps.includes(s.id)
  )?.id ?? 1;

  // Remaining time estimate based on incomplete steps
  const remainingMinutes = ONBOARDING_STEPS.reduce(
    (sum, step, idx) =>
      progress?.completed_steps.includes(step.id) ? sum : sum + STEP_TIME_MINUTES[idx],
    0
  );

  const handleSkip = async () => {
    await skipOnboarding.mutateAsync();
    onClose();
  };

  const handleGoToStep = (stepId: number) => {
    const routes: Record<number, string> = {
      1: '/app/profile',
      2: '/app/customers',
      3: '/app/offers/new',
      4: '/app/offers',
      5: '/app/offers',
    };

    onClose();
    navigate(routes[stepId]);
  };

  const handleFinish = () => {
    onClose();
    navigate('/app/dashboard');
  };

  if (isLoading) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden" aria-describedby={undefined}>
        <DialogTitle className="sr-only">{t('onboarding.wizardTitle')}</DialogTitle>
        {isAllDone ? (
          <div className="p-8 text-center animate-fade-in relative">
            <CelebrationParticles />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10"
            >
              <Sparkles className="h-10 w-10 text-success" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">{t('onboarding.congratsTitle')}</h2>
            <p className="text-muted-foreground mb-6">
              {t('onboarding.congratsDesc')}
            </p>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 rounded-lg bg-muted/50">
                <CheckCircle2 className="h-6 w-6 text-success mx-auto mb-1" />
                <p className="text-sm text-muted-foreground">{t('onboarding.completionCompanyProfile')}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <CheckCircle2 className="h-6 w-6 text-success mx-auto mb-1" />
                <p className="text-sm text-muted-foreground">{t('onboarding.completionFirstClient')}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <CheckCircle2 className="h-6 w-6 text-success mx-auto mb-1" />
                <p className="text-sm text-muted-foreground">{t('onboarding.completionFirstProject')}</p>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => { onClose(); navigate('/app/projects/new'); }}>
                <FolderOpen className="mr-2 h-4 w-4" />
                {t('onboarding.newProject')}
              </Button>
              <Button variant="outline" onClick={handleFinish}>
                {t('onboarding.goToDashboard')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            {/* Header */}
            <div className="p-6 pb-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">{t('onboarding.welcome')}</h2>
                  <p className="text-sm text-muted-foreground">
                    {t('onboarding.setupSubtitle')}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleSkip}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  {t('onboarding.completedOf', { completed: completedCount, total: ONBOARDING_STEPS.length })}
                </p>
                {remainingMinutes > 0 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {t('onboarding.timeRemaining', { minutes: remainingMinutes })}
                  </p>
                )}
              </div>
            </div>

            {/* Steps */}
            <div className="p-6 space-y-3">
              {ONBOARDING_STEPS.map((step, index) => {
                const Icon = stepIcons[index];
                const isCompleted = progress?.completed_steps.includes(step.id);
                const isNext = step.id === nextStepId;

                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className={`flex items-center gap-4 p-4 rounded-lg border transition-colors cursor-pointer ${
                      isCompleted
                        ? 'bg-success/5 border-success/20'
                        : isNext
                          ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20'
                          : 'bg-muted/30 border-border hover:bg-muted/50'
                    }`}
                    onClick={() => !isCompleted && handleGoToStep(step.id)}
                  >
                    {/* Step number / check circle */}
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold shrink-0 ${
                      isCompleted
                        ? 'bg-success text-success-foreground'
                        : isNext
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <span>{step.id}</span>
                      )}
                    </div>

                    {/* Step content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 shrink-0 ${isCompleted ? 'text-success' : isNext ? 'text-primary' : 'text-muted-foreground'}`} />
                        <p className={`font-medium truncate ${isCompleted ? 'text-success' : ''}`}>
                          {t(step.titleKey)}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{t(step.descriptionKey)}</p>
                      {!isCompleted && (
                        <p className="text-xs text-muted-foreground/70 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          ~{STEP_TIME_MINUTES[index]} min
                        </p>
                      )}
                    </div>

                    {/* Action */}
                    {!isCompleted && (
                      <Button
                        size="sm"
                        variant={isNext ? 'default' : 'outline'}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGoToStep(step.id);
                        }}
                      >
                        {t('onboarding.startStep')}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Encouragement message */}
            {completedCount > 0 && completedCount < ONBOARDING_STEPS.length && (
              <div className="px-6 pb-2">
                <p className="text-sm text-success font-medium text-center">
                  {t('onboarding.encouragement', { completed: completedCount, total: ONBOARDING_STEPS.length })}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="p-6 pt-2 flex justify-between items-center">
              <Button variant="ghost" onClick={handleSkip}>
                {t('onboarding.skipForNow')}
              </Button>
              <p className="text-xs text-muted-foreground">
                {t('onboarding.returnHint')}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
