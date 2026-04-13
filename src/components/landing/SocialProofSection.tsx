import { Quote, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LANDING_ASSETS } from '@/config/landingAssets';

// All testimonial data and placeholder flags live in src/config/landingAssets.ts.
//
// SWAP-IN PATH (no component changes needed):
//   1. Testimonials  → set isPlaceholder: false, verified: true per item, add real quotes
//   2. Photos        → set photoPath: '/assets/testimonials/<file>.jpg' per item
//   3. Client logos  → push entries to clientLogos[] (written approval required per company)
const { items: TESTIMONIALS, isPlaceholder } = LANDING_ASSETS.socialProof;
const { clientLogos } = LANDING_ASSETS;

// Variable-width slots give the placeholder logo row a natural, non-mechanical look.
const PLACEHOLDER_SLOT_WIDTHS = [88, 72, 104, 80, 96] as const;

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

          {/* ── Placeholder notice ─────────────────────────────────────────
              Shown when isPlaceholder: true. Removed automatically once the
              flag is flipped to false in landingAssets.ts.
              Amber tint makes it clearly readable — not a hidden micro-label. */}
          {isPlaceholder && (
            <div
              role="note"
              className="mt-6 inline-flex items-start gap-3 max-w-xl text-left bg-accent-amber/5 dark:bg-accent-amber/10 border border-accent-amber/25 rounded-xl px-4 py-3"
            >
              <Info
                className="w-4 h-4 text-accent-amber mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <p className="text-sm text-gray-600 dark:text-neutral-400 leading-snug">
                {t('landing.socialProof.placeholderNotice')}
              </p>
            </div>
          )}
        </div>

        {/* ── Testimonial cards — 1 col mobile, 3 cols desktop ───────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {TESTIMONIALS.map((item) => (
            <div
              key={item.key}
              className="relative bg-white dark:bg-brand-card border border-gray-200 dark:border-brand-border rounded-2xl p-6 flex flex-col gap-5 shadow-sm transition-all duration-300 hover:border-accent-amber/40 hover:shadow-lg hover:shadow-accent-amber/5"
            >
              {/* Unverified badge — visible per card while item.verified === false.
                  Positioned top-right so it doesn't disrupt the reading flow.
                  Disappears automatically once verified: true is set in config. */}
              {!item.verified && (
                <span
                  aria-label={t('landing.socialProof.unverifiedAriaLabel')}
                  className="absolute top-4 right-4 text-[10px] font-semibold uppercase tracking-wider text-accent-amber/70 dark:text-accent-amber/60 bg-accent-amber/10 dark:bg-accent-amber/10 border border-accent-amber/20 rounded px-1.5 py-0.5 leading-none"
                >
                  {t('landing.socialProof.unverifiedBadge')}
                </span>
              )}

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

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight truncate">
                    {t(`landing.socialProof.${item.key}.name`)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-neutral-500 mt-0.5 truncate">
                    {t(`landing.socialProof.${item.key}.role`)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Logo strip ─────────────────────────────────────────────────────
            Real mode  : heading + real logos from clientLogos[]
            Placeholder: sr-only label + decorative empty slots (aria-hidden)
            Activation : push entries to LANDING_ASSETS.clientLogos[] in
                         src/config/landingAssets.ts (written approval required). */}
        <div className="border-t border-gray-100 dark:border-brand-border pt-10">

          {clientLogos.length > 0 ? (
            <>
              <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-neutral-600 mb-7">
                {t('landing.socialProof.logoStripTitle')}
              </p>
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
            </>
          ) : (
            /* Placeholder: purely decorative slot shapes.
               Screen readers get an honest sr-only label instead of silence. */
            <div role="presentation">
              <p className="sr-only">{t('landing.socialProof.logoStripPlaceholder')}</p>
              <div
                className="flex flex-wrap items-center justify-center gap-4 md:gap-5"
                aria-hidden="true"
              >
                {PLACEHOLDER_SLOT_WIDTHS.map((width, i) => (
                  <div
                    key={i}
                    className="h-7 rounded-md bg-gray-100 dark:bg-brand-surface/50 border border-dashed border-gray-200 dark:border-brand-border/40"
                    style={{ width }}
                  />
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </section>
  );
}
