import { Quote, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LANDING_ASSETS } from '@/config/landingAssets';

// Testimonial data and placeholder state are managed in src/config/landingAssets.ts.
// Flip socialProof.isPlaceholder to false and set verified: true on each item
// when real, consented testimonials are ready. Add real logos to clientLogos[]
// when each company has approved their logo usage.
const { items: TESTIMONIALS, isPlaceholder } = LANDING_ASSETS.socialProof;
const { clientLogos } = LANDING_ASSETS;

// Variable-width placeholder slots give the logo strip a natural, non-uniform look.
const PLACEHOLDER_SLOT_WIDTHS = [88, 72, 100, 80, 92] as const;

export function SocialProofSection() {
  const { t } = useTranslation();

  return (
    <section
      className="py-20 md:py-28 bg-white dark:bg-brand-dark"
      aria-labelledby="social-proof-heading"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Section header ─────────────────────────────────────────────── */}
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

          {/* Placeholder notice — visible only while isPlaceholder: true.
              Removed automatically when config is flipped to real content. */}
          {isPlaceholder && (
            <div className="mt-5 inline-flex items-center gap-2 text-xs text-gray-400 dark:text-neutral-600 bg-gray-50 dark:bg-brand-surface border border-gray-200 dark:border-brand-border rounded-lg px-3 py-2 max-w-lg">
              <Info className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{t('landing.socialProof.placeholderNotice')}</span>
            </div>
          )}
        </div>

        {/* ── Testimonial cards — 1 col mobile, 3 cols desktop ───────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {TESTIMONIALS.map((item) => (
            <div
              key={item.key}
              className="bg-white dark:bg-brand-card border border-gray-200 dark:border-brand-border rounded-2xl p-6 flex flex-col gap-5 shadow-sm transition-all duration-300 hover:border-accent-amber/40 hover:shadow-lg hover:shadow-accent-amber/5"
            >
              {/* Decorative quotation mark */}
              <Quote
                className="w-7 h-7 text-accent-amber/30 shrink-0"
                aria-hidden="true"
              />

              {/* Quote body */}
              <p className="text-sm text-gray-700 dark:text-neutral-300 leading-relaxed flex-1">
                {t(`landing.socialProof.${item.key}.quote`)}
              </p>

              {/* Author row */}
              <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-brand-border">
                {/* Avatar: real photo when available, initials circle otherwise */}
                {item.photoPath ? (
                  <img
                    src={item.photoPath}
                    alt=""
                    aria-hidden="true"
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${item.avatarClass}`}
                    aria-hidden="true"
                  >
                    {item.initials}
                  </div>
                )}

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

        {/* ── Logo strip — real logos or placeholder slots ────────────────
            Structure is ready for real client logos.
            To activate: add entries to LANDING_ASSETS.clientLogos[] in
            src/config/landingAssets.ts — each entry requires written
            approval from the respective company. */}
        <div className="border-t border-gray-100 dark:border-brand-border pt-10">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-neutral-600 mb-7">
            {clientLogos.length > 0
              ? t('landing.socialProof.logoStripTitle')
              : t('landing.socialProof.logoStripPlaceholder')}
          </p>

          {clientLogos.length > 0 ? (
            /* Real logo strip — rendered once clientLogos[] is populated */
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              {clientLogos.map((logo) =>
                logo.url ? (
                  <a
                    key={logo.name}
                    href={logo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={logo.name}
                    className="opacity-50 hover:opacity-80 transition-opacity duration-200 grayscale hover:grayscale-0"
                  >
                    <img
                      src={logo.logoPath}
                      alt={logo.name}
                      className="h-8 w-auto max-w-[120px] object-contain"
                    />
                  </a>
                ) : (
                  <img
                    key={logo.name}
                    src={logo.logoPath}
                    alt={logo.name}
                    className="h-8 w-auto max-w-[120px] object-contain opacity-50 grayscale"
                  />
                )
              )}
            </div>
          ) : (
            /* Placeholder logo slots — aria-hidden, purely decorative.
               Variable widths prevent a mechanical grid look. */
            <div
              className="flex flex-wrap items-center justify-center gap-4 md:gap-5"
              aria-hidden="true"
            >
              {PLACEHOLDER_SLOT_WIDTHS.map((width, i) => (
                <div
                  key={i}
                  className="h-7 rounded bg-gray-100 dark:bg-brand-surface/50 border border-dashed border-gray-200 dark:border-brand-border/50"
                  style={{ width }}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
