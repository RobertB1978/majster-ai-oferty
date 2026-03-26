import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Home, Plus, MoreHorizontal, ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import OnboardingStep1 from '@/components/illustrations/OnboardingStep1';
import OnboardingStep2 from '@/components/illustrations/OnboardingStep2';
import OnboardingStep3 from '@/components/illustrations/OnboardingStep3';

const LS_KEY = 'onboarding_new_shell_completed';

type IllustrationComponent = typeof OnboardingStep1;

interface OnboardingStep {
  icon: React.ComponentType<{ className?: string }>;
  illustration: IllustrationComponent;
  titleKey: string;
  descKey: string;
}

const STEPS: OnboardingStep[] = [
  {
    icon: Home,
    illustration: OnboardingStep1,
    titleKey: 'newShell.onboarding.step1Title',
    descKey: 'newShell.onboarding.step1Desc',
  },
  {
    icon: Plus,
    illustration: OnboardingStep2,
    titleKey: 'newShell.onboarding.step2Title',
    descKey: 'newShell.onboarding.step2Desc',
  },
  {
    icon: MoreHorizontal,
    illustration: OnboardingStep3,
    titleKey: 'newShell.onboarding.step3Title',
    descKey: 'newShell.onboarding.step3Desc',
  },
];

/**
 * NewShellOnboarding — lekki onboarding 3-krokowy.
 *
 * - Pokazuje się tylko raz (klucz w localStorage: `onboarding_new_shell_completed`)
 * - 3 kroki: Home / FAB / Więcej
 * - Można pominąć w dowolnym momencie
 * - Spełnia DoD PR-07 (lekki, bez ciężkiego systemu tutoriali)
 */
export function NewShellOnboarding() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      const done = localStorage.getItem(LS_KEY);
      if (!done) setVisible(true);
    } catch {
      // prywatny tryb — nie pokazujemy
    }
  }, []);

  function complete() {
    try {
      localStorage.setItem(LS_KEY, 'true');
    } catch {
      // ignorujemy
    }
    setVisible(false);
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      complete();
    }
  }

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        style={{ zIndex: 80 }}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="fixed bottom-0 left-0 right-0 bg-card rounded-t-2xl shadow-2xl p-6 pb-8"
        style={{ zIndex: 81 }}
      >
        {/* Przycisk pomiń */}
        <button
          onClick={complete}
          className="absolute top-4 right-4 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
          aria-label={t('newShell.onboarding.skip')}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Ilustracja kroku (Faza 5) */}
        <div className="flex justify-center mb-2">
          <current.illustration size={112} />
        </div>

        {/* Treść */}
        <h2 id="onboarding-title" className="text-lg font-semibold text-foreground text-center mb-2">
          {t(current.titleKey)}
        </h2>
        <p className="text-sm text-muted-foreground text-center leading-relaxed mb-6">
          {t(current.descKey)}
        </p>

        {/* Wskaźniki kroków */}
        <div className="flex justify-center gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === step ? 'w-6 bg-primary' : 'w-1.5 bg-primary/30'
              )}
            />
          ))}
        </div>

        {/* Przycisk Dalej / Zakończ */}
        <button
          onClick={next}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-medium rounded-xl py-3.5 min-h-[44px] transition-colors hover:bg-primary/90 active:bg-primary/80"
        >
          {step < STEPS.length - 1 ? (
            <>
              {t('newShell.onboarding.next')}
              <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            t('newShell.onboarding.finish')
          )}
        </button>
      </div>
    </>
  );
}
