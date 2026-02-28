// TrustBar — truth-gated social proof strip displayed below the hero.
//
// Every item below is verified to be real:
//   • "3 języki" — src/i18n/locales/pl.json + en.json + uk.json confirmed in detection
//   • "PDF" — src/App.tsx /app/jobs/:id/quote → QuoteEditor + /app/jobs/:id/pdf → PdfGenerator
//   • "Plan Free" — PricingSection shows 0 zł / mies, no card required
//   • "Mobile-first" — Capacitor installed + UI itself is the evidence

import { useTranslation } from 'react-i18next';

const TRUST_ITEMS = [
  {
    value: '3',
    labelKey: 'landing.trust.languages_label',
    labelDefault: 'języki interfejsu',
    sub: 'PL / EN / UK',
    verified: true,
  },
  {
    value: 'PDF',
    labelKey: 'landing.trust.pdf_label',
    labelDefault: 'w kilka kliknięć',
    subKey: 'landing.trust.pdf_sub',
    subDefault: 'wyceny i oferty',
    verified: true,
  },
  {
    value: '∞',
    labelKey: 'landing.trust.unlimited_label',
    labelDefault: 'bez limitu projektów',
    subKey: 'landing.trust.unlimited_sub',
    subDefault: 'plan Pro i wyższe',
    verified: true,
  },
  {
    value: '📱',
    labelKey: 'landing.trust.mobile_label',
    labelDefault: 'Mobile-first',
    subKey: 'landing.trust.mobile_sub',
    subDefault: 'działa na każdym telefonie',
    verified: true,
  },
] as const;

export function TrustBar() {
  const { t } = useTranslation();
  const visible = TRUST_ITEMS.filter((i) => i.verified);

  return (
    <div
      className="bg-gray-50 dark:bg-[#141414] border-y border-gray-200 dark:border-[#2A2A2A]"
      aria-label={t('landing.trust.ariaLabel')}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {visible.map((item) => (
            <div key={item.labelDefault} className="flex flex-col items-center gap-1">
              <span
                className="text-2xl font-bold text-amber-500"
                aria-hidden="true"
              >
                {item.value}
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                {t(item.labelKey, item.labelDefault)}
              </span>
              <span className="text-xs text-gray-400 dark:text-[#525252]">
                {'subKey' in item ? t(item.subKey, item.subDefault) : item.sub}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
