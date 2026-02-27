import { useState } from 'react';
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
  Sparkles
} from 'lucide-react';
import { 
  useOnboardingProgress, 
  useSkipOnboarding,
  ONBOARDING_STEPS 
} from '@/hooks/useOnboarding';

const stepIcons = [Building2, Users, FolderOpen, FileText, Download];

interface OnboardingWizardProps {
  open: boolean;
  onClose: () => void;
}

export function OnboardingWizard({ open, onClose }: OnboardingWizardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: progress, isLoading } = useOnboardingProgress();
  const skipOnboarding = useSkipOnboarding();
  const [currentStep, setCurrentStep] = useState(1);
  const [showCongrats, _setShowCongrats] = useState(false);

  const progressPercent = progress 
    ? (progress.completed_steps.length / ONBOARDING_STEPS.length) * 100 
    : 0;

  const handleSkip = async () => {
    await skipOnboarding.mutateAsync();
    onClose();
  };

  const handleGoToStep = (stepId: number) => {
    const routes: Record<number, string> = {
      1: '/profile',
      2: '/clients',
      3: '/projects/new',
      4: '/projects',
      5: '/projects',
    };
    
    onClose();
    navigate(routes[stepId]);
  };

  const handleFinish = () => {
    onClose();
    navigate('/dashboard');
  };

  if (isLoading) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden" aria-describedby={undefined}>
        <DialogTitle className="sr-only">{t('onboarding.wizardTitle')}</DialogTitle>
        {showCongrats ? (
          <div className="p-8 text-center animate-fade-in">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
              <Sparkles className="h-10 w-10 text-success" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{t('onboarding.congratsTitle')}</h2>
            <p className="text-muted-foreground mb-6">
              {t('onboarding.congratsDesc')}
            </p>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-primary">✓</p>
                <p className="text-sm text-muted-foreground">{t('onboarding.completionCompanyProfile')}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-primary">✓</p>
                <p className="text-sm text-muted-foreground">{t('onboarding.completionFirstClient')}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-primary">✓</p>
                <p className="text-sm text-muted-foreground">{t('onboarding.completionFirstProject')}</p>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => { onClose(); navigate('/app/jobs/new'); }}>
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
              <p className="text-xs text-muted-foreground mt-2">
                {t('onboarding.completedOf', { completed: progress?.completed_steps.length || 0, total: ONBOARDING_STEPS.length })}
              </p>
            </div>

            {/* Steps */}
            <div className="p-6 space-y-3">
              {ONBOARDING_STEPS.map((step, index) => {
                const Icon = stepIcons[index];
                const isCompleted = progress?.completed_steps.includes(step.id);
                const isCurrent = currentStep === step.id;

                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border transition-colors cursor-pointer ${
                      isCompleted 
                        ? 'bg-success/5 border-success/20' 
                        : isCurrent 
                          ? 'bg-primary/5 border-primary/20' 
                          : 'bg-muted/30 border-border hover:bg-muted/50'
                    }`}
                    onClick={() => setCurrentStep(step.id)}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      isCompleted 
                        ? 'bg-success text-success-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${isCompleted ? 'text-success' : ''}`}>
                        {step.title}
                      </p>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                    {!isCompleted && (
                      <Button
                        size="sm"
                        variant={isCurrent ? 'default' : 'outline'}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGoToStep(step.id);
                        }}
                      >
                        {t('onboarding.startStep')}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-6 pt-0 flex justify-between items-center">
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
