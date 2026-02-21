import { useTranslation } from 'react-i18next';

export function TrustBar() {
  const { t } = useTranslation();

  // Every item is truth-gated (confirmed in Phase 0 detection)
  const TRUST_ITEMS = [
    {
      value: '3',
      label: t('landing.trust.languages_label', 'języki interfejsu'),
      sub: 'PL / EN / UK',
    },
    {
      value: 'PDF',
      label: t('landing.trust.pdf_label', 'w kilka kliknięć'),
      sub: t('landing.trust.pdf_sub', 'wyceny i oferty'),
    },
    {
      value: '∞',
      label: t('landing.trust.unlimited_label', 'bez limitu projektów'),
      sub: t('landing.trust.unlimited_sub', 'plan Pro i wyższe'),
    },
    {
      value: '📱',
      label: t('landing.trust.mobile_label', 'Mobile-first'),
      sub: t('landing.trust.mobile_sub', 'działa na każdym telefonie'),
    },
  ];

  return (
    <div
      className="bg-gray-50 dark:bg-[#141414] border-y border-gray-200 dark:border-[#2A2A2A]"
      aria-label="Kluczowe informacje o platformie"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {TRUST_ITEMS.map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-amber-500" aria-hidden="true">
                {item.value}
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                {item.label}
              </span>
              <span className="text-xs text-gray-400 dark:text-[#525252]">{item.sub}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
