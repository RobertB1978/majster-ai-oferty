import { Clock, TrendingUp, FileText, Target, Zap, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * ExpectedResultsSection — replaces the former TestimonialsSection.
 *
 * TRUTH GATE: This section does NOT use fake names, fake quotes, or fake ratings.
 * Instead it shows what the platform is designed to help users achieve,
 * clearly framed as "expected results" — not as verified testimonials.
 */
export function TestimonialsSection() {
  const { t } = useTranslation();

  const RESULTS = [
    {
      key: 'time',
      icon: Clock,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20',
    },
    {
      key: 'quality',
      icon: FileText,
      color: 'text-info',
      bgColor: 'bg-info/10',
      borderColor: 'border-info/20',
    },
    {
      key: 'control',
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/20',
    },
  ];

  const PRINCIPLES = [
    { key: 'noLock', icon: Target },
    { key: 'youDecide', icon: Zap },
    { key: 'dataYours', icon: Shield },
  ];

  return (
    <section
      className="py-20 md:py-28 bg-white dark:bg-brand-dark"
      aria-labelledby="results-heading"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-600 dark:text-amber-400 mb-6">
            {t('landing.results.badge')}
          </div>
          <h2
            id="results-heading"
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
          >
            {t('landing.results.sectionTitle')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-neutral-400 leading-relaxed max-w-2xl mx-auto">
            {t('landing.results.sectionSubtitle')}
          </p>
        </div>

        {/* Results cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {RESULTS.map((result) => (
            <div
              key={result.key}
              className={`relative bg-gray-50 dark:bg-brand-card border border-gray-200 dark:border-brand-border rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5`}
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl ${result.bgColor} flex items-center justify-center`}>
                <result.icon className={`w-6 h-6 ${result.color}`} aria-hidden="true" />
              </div>

              {/* Headline result */}
              <div>
                <div className={`text-2xl font-bold ${result.color} mb-1`}>
                  {t(`landing.results.${result.key}.metric`)}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t(`landing.results.${result.key}.title`)}
                </h3>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 dark:text-neutral-400 leading-relaxed flex-1">
                {t(`landing.results.${result.key}.desc`)}
              </p>

              {/* How badge */}
              <div className={`${result.bgColor} border ${result.borderColor} rounded-lg px-3 py-2`}>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {t(`landing.results.${result.key}.how`)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Honesty principles bar */}
        <div className="bg-gray-50 dark:bg-brand-card border border-gray-200 dark:border-brand-border rounded-2xl p-6">
          <p className="text-center text-sm font-semibold text-gray-900 dark:text-white mb-4">
            {t('landing.results.principlesTitle')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PRINCIPLES.map((p) => (
              <div key={p.key} className="flex items-center gap-3 justify-center sm:justify-start">
                <p.icon className="w-4 h-4 text-amber-500 shrink-0" aria-hidden="true" />
                <span className="text-sm text-gray-600 dark:text-neutral-400">
                  {t(`landing.results.principles.${p.key}`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
