import { X, Check, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * BeforeAfterSection — shows contrast between manual workflow (Excel/paper)
 * and using Majster.AI. No fake claims — every "after" item corresponds to
 * a verified feature in the product.
 */
export function BeforeAfterSection() {
  const { t } = useTranslation();

  const ITEMS = [
    { key: 'quotes' },
    { key: 'clients' },
    { key: 'tracking' },
    { key: 'mobile' },
    { key: 'language' },
  ];

  return (
    <section
      className="py-20 md:py-28 bg-gray-50 dark:bg-[#141414]"
      aria-labelledby="before-after-heading"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            id="before-after-heading"
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
          >
            {t('landing.beforeAfter.sectionTitle')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-[#A3A3A3] leading-relaxed max-w-2xl mx-auto">
            {t('landing.beforeAfter.sectionSubtitle')}
          </p>
        </div>

        {/* Comparison grid */}
        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-gray-200 dark:border-[#2A2A2A]">
            <div className="p-4 md:p-5 text-center">
              <span className="text-sm font-semibold text-gray-400 dark:text-[#525252] uppercase tracking-wide">
                {t('landing.beforeAfter.beforeLabel')}
              </span>
            </div>
            <div className="w-px h-full bg-gray-200 dark:bg-[#2A2A2A]" aria-hidden="true" />
            <div className="p-4 md:p-5 text-center">
              <span className="text-sm font-semibold text-amber-500 uppercase tracking-wide">
                Majster.AI
              </span>
            </div>
          </div>

          {/* Comparison rows */}
          {ITEMS.map((item, idx) => (
            <div
              key={item.key}
              className={`grid grid-cols-[1fr_auto_1fr] items-center ${
                idx < ITEMS.length - 1 ? 'border-b border-gray-100 dark:border-[#2A2A2A]/50' : ''
              }`}
            >
              {/* Before */}
              <div className="p-4 md:p-5 flex items-start gap-3">
                <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-sm text-gray-500 dark:text-[#A3A3A3]">
                  {t(`landing.beforeAfter.${item.key}.before`)}
                </span>
              </div>

              {/* Divider with arrow */}
              <div className="flex items-center justify-center px-2">
                <ArrowRight className="w-4 h-4 text-amber-500/40" aria-hidden="true" />
              </div>

              {/* After */}
              <div className="p-4 md:p-5 flex items-start gap-3">
                <Check className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {t(`landing.beforeAfter.${item.key}.after`)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
