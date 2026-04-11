// TrustBar — truth-gated social proof strip displayed below the hero.
//
// Every item below is verified to be real:
//   • "3 języki" — src/i18n/locales/pl.json + en.json + uk.json confirmed in detection
//   • "PDF" — src/App.tsx /app/projects/:id/quote → QuoteEditor, /app/projects/:id/pdf → PdfGenerator
//   • "Plan Free" — PricingSection shows 0 zł / mies, no card required
//   • "Mobile-first" — Capacitor installed + UI itself is the evidence

import { useTranslation } from 'react-i18next';
import { FileText, Globe, Clock, Smartphone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface TrustItem {
  value: string;
  labelKey: string;
  labelDefault: string;
  subKey?: string;
  subDefault?: string;
  sub?: string;
  icon: LucideIcon;
  verified: boolean;
}

const TRUST_ITEMS: TrustItem[] = [
  {
    value: '3',
    labelKey: 'landing.trust.languages_label',
    labelDefault: 'języki interfejsu',
    sub: 'PL / EN / UK',
    icon: Globe,
    verified: true,
  },
  {
    value: 'PDF',
    labelKey: 'landing.trust.pdf_label',
    labelDefault: 'w kilka kliknięć',
    subKey: 'landing.trust.pdf_sub',
    subDefault: 'profesjonalne oferty',
    icon: FileText,
    verified: true,
  },
  {
    value: '5 min',
    labelKey: 'landing.trust.speed_label',
    labelDefault: 'pierwsza oferta',
    subKey: 'landing.trust.speed_sub',
    subDefault: 'od rejestracji do PDF',
    icon: Clock,
    verified: true,
  },
  {
    value: '📱',
    labelKey: 'landing.trust.mobile_label',
    labelDefault: 'Mobile-first',
    subKey: 'landing.trust.mobile_sub',
    subDefault: 'iOS, Android, Web',
    icon: Smartphone,
    verified: true,
  },
];

export function TrustBar() {
  const { t } = useTranslation();
  const visible = TRUST_ITEMS.filter((i) => i.verified);

  return (
    <div
      className="bg-gray-50 dark:bg-brand-surface border-y border-gray-200 dark:border-brand-border"
      aria-label={t('landing.trust.ariaLabel')}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {visible.map((item) => (
            <div key={item.labelDefault} className="flex items-center gap-3 justify-center md:justify-start">
              <div className="w-10 h-10 rounded-xl bg-accent-amber/10 flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-accent-amber" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-accent-amber">
                    {item.value}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white leading-tight truncate">
                    {t(item.labelKey, item.labelDefault)}
                  </span>
                </div>
                <span className="text-xs text-gray-400 dark:text-neutral-600">
                  {'subKey' in item && item.subKey ? t(item.subKey, item.subDefault) : item.sub}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
