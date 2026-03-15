import { UserPlus, FolderPlus, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function HowItWorksSection() {
  const { t } = useTranslation();

  const STEPS = [
    {
      number: '1',
      icon: UserPlus,
      title: t('landing.how.step1_title'),
      desc: t('landing.how.step1_desc'),
    },
    {
      number: '2',
      icon: FolderPlus,
      title: t('landing.how.step2_title'),
      desc: t('landing.how.step2_desc'),
    },
    {
      number: '3',
      icon: Send,
      title: t('landing.how.step3_title'),
      desc: t('landing.how.step3_desc'),
    },
  ];

  return (
    <section
      id="how-it-works"
      className="py-20 md:py-28 bg-white dark:bg-[#0F0F0F]"
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
          <p className="text-lg text-gray-600 dark:text-[#A3A3A3] leading-relaxed max-w-xl mx-auto">
            {t('landing.how.sectionSubtitle')}
          </p>
        </div>

        {/* Desktop: row with gradient connectors */}
        <div className="hidden md:flex items-start gap-0 max-w-4xl mx-auto">
          {STEPS.map((step, idx) => (
            <div key={step.number} className="flex items-start flex-1">
              <div className="flex-1 text-center px-4">
                <div className="relative inline-block">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-amber-500/25">
                    <step.icon className="w-7 h-7 text-white" aria-hidden="true" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white dark:bg-[#0F0F0F] border-2 border-amber-500 flex items-center justify-center shadow-sm">
                    <span className="text-amber-500 text-xs font-bold">{step.number}</span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 dark:text-[#A3A3A3] leading-relaxed">{step.desc}</p>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className="shrink-0 mt-8 w-12 border-t-2 border-dashed border-amber-500/30"
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
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                  <step.icon className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                {idx < STEPS.length - 1 && (
                  <div className="w-0.5 flex-1 mt-2 mb-2 bg-amber-500/20" aria-hidden="true" />
                )}
              </div>
              <div className="flex-1 pb-6">
                <div className="text-amber-500 text-xs font-bold mb-1">
                  {t('landing.how.step')} {step.number}
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{step.title}</h3>
                <p className="text-sm text-gray-600 dark:text-[#A3A3A3] leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
