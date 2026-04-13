import { Quote } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// ---------------------------------------------------------------------------
// PLACEHOLDER DATA — replace initials, keys, and avatarClass when you have
// real testimonials from verified users. The i18n keys below correspond to
// landing.socialProof.t1 / t2 / t3 in each locale file.
// ---------------------------------------------------------------------------
const TESTIMONIALS = [
  {
    key: 't1',
    initials: 'MK',
    avatarClass:
      'bg-amber-100 dark:bg-accent-amber/20 text-amber-800 dark:text-accent-amber',
  },
  {
    key: 't2',
    initials: 'DS',
    avatarClass:
      'bg-gray-100 dark:bg-brand-surface text-gray-700 dark:text-neutral-300',
  },
  {
    key: 't3',
    initials: 'TW',
    avatarClass:
      'bg-amber-50 dark:bg-accent-amber/10 text-amber-700 dark:text-accent-amber-light',
  },
] as const;

export function SocialProofSection() {
  const { t } = useTranslation();

  return (
    <section
      className="py-20 md:py-28 bg-white dark:bg-brand-dark"
      aria-labelledby="social-proof-heading"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent-amber/30 bg-accent-amber/10 px-4 py-1.5 text-sm font-medium text-accent-amber dark:text-accent-amber-light mb-6">
            {t('landing.socialProof.badge')}
          </div>
          <h2
            id="social-proof-heading"
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
          >
            {t('landing.socialProof.sectionTitle')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-neutral-400 leading-relaxed max-w-2xl mx-auto">
            {t('landing.socialProof.sectionSubtitle')}
          </p>
        </div>

        {/* Testimonial cards — 1 col mobile, 3 cols desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((item) => (
            <div
              key={item.key}
              className="bg-white dark:bg-brand-card border border-gray-200 dark:border-brand-border rounded-2xl p-6 flex flex-col gap-5 shadow-sm transition-all duration-300 hover:border-accent-amber/40 hover:shadow-lg hover:shadow-accent-amber/5"
            >
              {/* Decorative quotation mark */}
              <Quote
                className="w-7 h-7 text-accent-amber/35 shrink-0"
                aria-hidden="true"
              />

              {/* Quote body */}
              <p className="text-gray-700 dark:text-neutral-300 leading-relaxed text-[0.95rem] flex-1">
                {t(`landing.socialProof.${item.key}.quote`)}
              </p>

              {/* Author row */}
              <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-brand-border">
                {/* Avatar — initials circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${item.avatarClass}`}
                  aria-hidden="true"
                >
                  {item.initials}
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                    {t(`landing.socialProof.${item.key}.name`)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-neutral-500 mt-0.5">
                    {t(`landing.socialProof.${item.key}.role`)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
