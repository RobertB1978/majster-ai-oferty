import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PLANS } from '@/config/plans';

// Features that are in beta/in-progress (cross-referenced with features.data.ts)
// Evidence: features.data.ts ai_assist/voice status='beta', api status='soon'
const PREP_FEATURES = new Set([
  'Asystent AI',
  'Dyktowanie głosem',
  'Dostęp do API',
  'Własne integracje (na zapytanie)',
]);

const CTA_ROUTE = '/register';

export function PricingSection() {
  const { t } = useTranslation();

  return (
    <section
      id="pricing"
      className="py-20 md:py-28 bg-gray-50 dark:bg-[#0F0F0F]"
      aria-labelledby="pricing-heading"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            id="pricing-heading"
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
          >
            {t('landing.pricing.sectionTitle', 'Przejrzyste ceny')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-[#A3A3A3] leading-relaxed max-w-xl mx-auto">
            {t('landing.pricing.sectionSubtitle', 'Zacznij bezpłatnie przez 30 dni. Rozwijaj się kiedy Twój biznes tego potrzebuje.')}
          </p>
          <p className="text-sm text-gray-400 dark:text-[#525252] mt-2">
            {t('landing.pricing.vatNote', 'Ceny netto · Do każdego zakupu doliczamy 23% VAT')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.slug}
              className={`relative bg-white dark:bg-[#1A1A1A] rounded-2xl p-6 flex flex-col gap-5 transition-all duration-300 ${
                plan.highlighted
                  ? 'border-2 border-amber-500'
                  : 'border border-gray-200 dark:border-[#2A2A2A] hover:border-amber-500/40'
              }`}
            >
              {/* Popular badge */}
              {plan.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-amber-500 text-black text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                    {t('landing.pricing.badge', 'Najpopularniejszy')}
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {plan.pricePLN === 0 ? '0' : plan.pricePLN}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-[#A3A3A3]">
                    {plan.pricePLN === 0 ? 'zł' : 'zł / mies'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-[#525252] leading-relaxed">{plan.description}</p>
              </div>

              {/* Features list */}
              <ul className="flex flex-col gap-2.5 flex-1" aria-label={`Funkcje planu ${plan.name}`}>
                {plan.features.map((feature) => {
                  const isPrep = PREP_FEATURES.has(feature);
                  return (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check
                        className="w-4 h-4 text-amber-500 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span className={isPrep ? 'text-gray-300 dark:text-[#525252]' : 'text-gray-600 dark:text-[#A3A3A3]'}>
                        {feature}
                        {isPrep && (
                          <span className="ml-1.5 text-[10px] font-medium text-gray-400 dark:text-[#525252] border border-gray-200 dark:border-[#2A2A2A] rounded px-1 py-0.5 uppercase tracking-wide align-middle">
                            W przygotowaniu
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
                    ? 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black'
                    : 'border border-gray-200 dark:border-[#2A2A2A] hover:border-amber-500/60 text-gray-900 dark:text-white hover:text-amber-500 dark:hover:text-amber-400'
                }`}
              >
                {plan.pricePLN === 0
                  ? t('landing.pricing.ctaFree', 'Zacznij za darmo')
                  : `${t('landing.pricing.ctaTry', 'Wypróbuj')} ${plan.name}`}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 dark:text-[#525252] mt-8">
          {t('landing.pricing.cancelNote', 'Anuluj w każdej chwili · Wystawiamy faktury VAT')}
        </p>
      </div>
    </section>
  );
}
