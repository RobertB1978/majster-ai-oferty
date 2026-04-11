import { UserPlus, FolderPlus, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ComponentType, SVGAttributes } from 'react';
import OnboardingStep1 from '@/components/illustrations/OnboardingStep1';
import OnboardingStep2 from '@/components/illustrations/OnboardingStep2';
import OnboardingStep3 from '@/components/illustrations/OnboardingStep3';

type IllustrationComponent = ComponentType<{
  className?: string;
  size?: number;
  animated?: boolean;
}>;

interface Step {
  number: string;
  icon: ComponentType<SVGAttributes<SVGElement> & { className?: string }>;
  illustration: IllustrationComponent;
  title: string;
  desc: string;
}

export function HowItWorksSection() {
  const { t } = useTranslation();

  const STEPS: Step[] = [
    {
      number: '1',
      icon: UserPlus,
      illustration: OnboardingStep1,
      title: t('landing.how.step1_title'),
      desc: t('landing.how.step1_desc'),
    },
    {
      number: '2',
      icon: FolderPlus,
      illustration: OnboardingStep2,
      title: t('landing.how.step2_title'),
      desc: t('landing.how.step2_desc'),
    },
    {
      number: '3',
      icon: Send,
      illustration: OnboardingStep3,
      title: t('landing.how.step3_title'),
      desc: t('landing.how.step3_desc'),
    },
  ];

  return (
    <section
      id="how-it-works"
      className="py-20 md:py-28 bg-white dark:bg-brand-dark"
      aria-labelledby="how-heading"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2
            id="how-heading"
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
          >
            {t('landing.how.sectionTitle')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-neutral-400 leading-relaxed max-w-xl mx-auto">
            {t('landing.how.sectionSubtitle')}
          </p>
        </div>

        {/* Desktop: row with illustrations + gradient connectors */}
        <div className="hidden md:flex items-start gap-0 max-w-4xl mx-auto">
          {STEPS.map((step, idx) => (
            <div key={step.number} className="flex items-start flex-1">
              <div className="flex-1 text-center px-4">
                {/* Illustration slot (Faza 5) */}
                <div className="flex justify-center mb-4">
                  <step.illustration size={96} className="opacity-90" />
                </div>

                {/* Icon badge with step number */}
                <div className="relative inline-block mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-amber to-accent-amber-hover flex items-center justify-center mx-auto shadow-lg shadow-accent-amber/25">
                    <step.icon className="w-6 h-6 text-white" aria-hidden="true" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white dark:bg-brand-dark border-2 border-accent-amber flex items-center justify-center shadow-sm">
                    <span className="text-accent-amber text-xs font-bold">{step.number}</span>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 dark:text-neutral-400 leading-relaxed">{step.desc}</p>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className="shrink-0 mt-20 w-12 border-t-2 border-dashed border-accent-amber/30"
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>

        {/* Mobile: column with vertical connector line */}
        <div className="flex md:hidden flex-col max-w-md mx-auto">
          {STEPS.map((step, idx) => (
            <div key={step.number} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-amber to-accent-amber-hover flex items-center justify-center shrink-0 shadow-md shadow-accent-amber/20">
                  <step.icon className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                {idx < STEPS.length - 1 && (
                  <div className="w-0.5 flex-1 mt-2 mb-2 bg-accent-amber/20" aria-hidden="true" />
                )}
              </div>
              <div className="flex-1 pb-6">
                <div className="flex items-center gap-3 mb-2">
                  <step.illustration size={56} animated={false} className="shrink-0" />
                  <div>
                    <div className="text-accent-amber text-xs font-bold mb-0.5">
                      {t('landing.how.step')} {step.number}
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">{step.title}</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-neutral-400 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
