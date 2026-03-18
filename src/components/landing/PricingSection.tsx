import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PLANS } from '@/config/plans';

// Features that are in beta/in-progress — matched by i18n key (not Polish fallback)
const PREP_KEYS = new Set([
  'billing.plans.business.features.aiAssistant',
  'billing.plans.business.features.voiceQuotes',
  'billing.plans.enterprise.features.apiAccess',
]);

// Enterprise plan is excluded from homepage pricing grid:
// SLA, dedicated manager, API and team training are not yet available.
// Users interested in Enterprise can contact via email shown below the grid.
const HOMEPAGE_PLAN_SLUGS = ['darmowy', 'pro', 'biznes'];

const CTA_ROUTE = '/register';

export function PricingSection() {
  const { t } = useTranslation();

  return (
    <section
      id="pricing"
      className="py-20 md:py-28 bg-gray-50 dark:bg-brand-dark"
      aria-labelledby="pricing-heading"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            id="pricing-heading"
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
          >
            {t('landing.pricing.sectionTitle')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-neutral-400 leading-relaxed max-w-xl mx-auto">
            {t('landing.pricing.sectionSubtitle')}
          </p>
          <p className="text-sm text-gray-400 dark:text-neutral-600 mt-2">
            {t('landing.pricing.vatNote')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {PLANS.filter((p) => HOMEPAGE_PLAN_SLUGS.includes(p.slug)).map((plan) => (
            <div
              key={plan.slug}
              className={`relative bg-white dark:bg-brand-card rounded-2xl p-6 flex flex-col gap-5 transition-all duration-300 ${
                plan.highlighted
                  ? 'border-2 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/20'
                  : 'border border-gray-200 dark:border-brand-border hover:border-amber-500/40 hover:shadow-md hover:shadow-gray-200/50 dark:hover:shadow-black/30'
              }`}
            >
              {/* Popular badge */}
              {plan.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-amber-500 to-amber-400 text-black text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap shadow-sm shadow-amber-500/30">
                    {t('landing.pricing.badge')}
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {t(plan.displayNameKey)}
                </h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {plan.pricePLN === 0 ? '0' : plan.pricePLN}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-neutral-400">
                    {plan.pricePLN === 0 ? 'zł' : `zł ${t('landing.pricing.per_month')}`}
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-neutral-600 leading-relaxed">
                  {t(plan.descriptionKey)}
                </p>
              </div>

              {/* Features list */}
              <ul className="flex flex-col gap-2.5 flex-1" aria-label={`${t('landing.pricing.planFeaturesLabel')} ${t(plan.displayNameKey)}`}>
                {plan.featuresKeys.map((featureKey) => {
                  const isPrep = PREP_KEYS.has(featureKey);
                  return (
                    <li key={featureKey} className="flex items-start gap-2 text-sm">
                      <Check
                        className="w-4 h-4 text-amber-500 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span className={isPrep ? 'text-gray-500 dark:text-neutral-500' : 'text-gray-600 dark:text-neutral-400'}>
                        {t(featureKey)}
                        {isPrep && (
                          <span className="ml-1.5 text-[10px] font-medium text-gray-600 dark:text-neutral-400 border border-gray-200 dark:border-brand-border rounded px-1 py-0.5 uppercase tracking-wide align-middle">
                            {t('landing.pricing.prepBadge')}
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {/* CTA */}
              <Link
                to={CTA_ROUTE}
                className={`block text-center py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black min-h-[44px] flex items-center justify-center ${
                  plan.highlighted
                    ? 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/25'
                    : 'border border-gray-200 dark:border-brand-border hover:border-amber-500/60 text-gray-900 dark:text-white hover:text-amber-500 dark:hover:text-amber-400'
                }`}
              >
                {plan.pricePLN === 0
                  ? t('landing.pricing.ctaFree')
                  : `${t('landing.pricing.ctaTry')} ${t(plan.displayNameKey)}`}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-600 dark:text-neutral-400 mt-8">
          {t('landing.pricing.cancelNote')}
        </p>

        <p className="text-center text-sm text-gray-500 dark:text-neutral-500 mt-3">
          {t('landing.pricing.enterpriseNote')}{' '}
          <a
            href="mailto:kontakt@majster.ai"
            className="underline text-gray-600 dark:text-gray-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors duration-200"
          >
            {t('landing.pricing.enterpriseContact')}
          </a>
        </p>
      </div>
    </section>
  );
}
