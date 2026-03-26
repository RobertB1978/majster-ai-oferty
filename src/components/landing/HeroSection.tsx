import { Link } from 'react-router-dom';
import { FileText, CheckCircle, ArrowDown, Shield, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const CTA_ROUTE = '/register';

function scrollToFeatures(e: React.MouseEvent<HTMLButtonElement>) {
  e.preventDefault();
  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function HeroSection() {
  const { t } = useTranslation();

  return (
    <section
      className="relative overflow-hidden bg-white dark:bg-brand-dark pt-24 pb-20 md:pt-32 md:pb-28"
      aria-label={t('landing.hero.ariaLabel')}
      style={{
        backgroundImage: `
          linear-gradient(hsl(var(--primary) / 0.04) 1px, transparent 1px),
          linear-gradient(90deg, hsl(var(--primary) / 0.04) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }}
    >
      {/* Multi-layer gradient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 60% 40% at 50% 0%, hsl(var(--primary) / 0.10) 0%, transparent 70%),
            radial-gradient(ellipse 40% 30% at 70% 20%, hsl(var(--primary) / 0.05) 0%, transparent 60%)
          `,
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Free plan badge */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-brand-card border border-gray-200 dark:border-brand-border rounded-full px-5 py-2.5 shadow-sm">
            <CheckCircle className="w-4 h-4 text-amber-500" aria-hidden="true" />
            <span className="text-sm text-gray-600 dark:text-neutral-400 font-medium">
              {t('landing.hero.freeBadge')}
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left: copy + CTAs */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-500 dark:text-amber-400 mb-6">
              <CheckCircle className="w-4 h-4" aria-hidden="true" />
              {t('landing.hero.badge')}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white leading-[1.1] mb-6">
              {t('landing.hero.title1')}{' '}
              <span className="relative">
                <span className="text-amber-500">{t('landing.hero.title2')}</span>
                <span
                  className="absolute -bottom-1 left-0 right-0 h-1 rounded-full bg-amber-500/30"
                  aria-hidden="true"
                />
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 dark:text-neutral-400 leading-relaxed max-w-2xl mx-auto lg:mx-0 mb-4">
              {t('landing.hero.subtitle')}
              <br className="hidden sm:block" />
              {t('landing.hero.subtitle2')}
            </p>

            <p className="text-base font-semibold text-amber-600 dark:text-amber-400 mb-8">
              {t('landing.hero.valueProp')}
            </p>

            {/* Trust signal chips */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-8">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-brand-card border border-gray-200 dark:border-brand-border rounded-xl px-4 py-2.5 shadow-sm">
                <FileText className="w-4 h-4 text-amber-500" aria-hidden="true" />
                <span className="text-gray-700 dark:text-neutral-400 text-sm font-medium">{t('landing.trust.pdfLabel')}</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-brand-card border border-gray-200 dark:border-brand-border rounded-xl px-4 py-2.5 shadow-sm">
                <Smartphone className="w-4 h-4 text-amber-500" aria-hidden="true" />
                <span className="text-gray-700 dark:text-neutral-400 text-sm font-medium">{t('landing.trust.mobileLabel')}</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-brand-card border border-gray-200 dark:border-brand-border rounded-xl px-4 py-2.5 shadow-sm">
                <Shield className="w-4 h-4 text-amber-500" aria-hidden="true" />
                <span className="text-gray-700 dark:text-neutral-400 text-sm font-medium">PL / EN / UK</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                to={CTA_ROUTE}
                className="inline-flex items-center justify-center bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-semibold px-8 py-4 rounded-xl text-base transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black min-h-[48px] shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30"
              >
                {t('landing.hero.cta_start')}
              </Link>
              <button
                onClick={scrollToFeatures}
                className="inline-flex items-center justify-center border border-gray-300 dark:border-brand-border hover:border-amber-500/60 text-gray-900 dark:text-white font-semibold px-8 py-4 rounded-xl text-base transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black min-h-[48px] gap-2 hover:bg-gray-50 dark:hover:bg-brand-card"
              >
                {t('landing.hero.cta_features')}
                <ArrowDown className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-3 text-sm text-gray-400 dark:text-neutral-600">
              {t('landing.hero.microcopy')}
            </p>
          </div>

          {/* Right: floating UI mock — enhanced */}
          <div className="hidden lg:flex flex-col items-center shrink-0 w-80">
            <div
              className="animate-float w-full"
              style={{ animationDuration: '4s' }}
            >
              {/* Main card with premium shadow */}
              <div className="bg-white dark:bg-brand-card border border-gray-200 dark:border-brand-border rounded-2xl p-5 shadow-xl shadow-gray-200/60 dark:shadow-black/50 ring-1 ring-gray-100 dark:ring-brand-border">
                {/* Header with gradient accent */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                    <FileText className="w-5 h-5 text-white" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-gray-900 dark:text-white text-sm font-semibold truncate">{t('landing.hero.mock.quoteTitle')}</div>
                    <div className="text-gray-400 dark:text-neutral-600 text-xs">{t('landing.hero.mock.projectName')}</div>
                  </div>
                  <div className="ml-auto shrink-0">
                    <span className="text-xs bg-gradient-to-r from-amber-500/20 to-amber-400/20 text-amber-600 dark:text-amber-400 rounded-full px-2.5 py-1 font-medium border border-amber-500/20">
                      PDF
                    </span>
                  </div>
                </div>

                {/* Line items */}
                <div className="space-y-2.5 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-neutral-400">{t('landing.hero.mock.labour')}</span>
                    <span className="text-gray-900 dark:text-white font-medium">2 400 zł</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-neutral-400">{t('landing.hero.mock.materials')}</span>
                    <span className="text-gray-900 dark:text-white font-medium">1 800 zł</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-neutral-400">{t('landing.hero.mock.extraLabour')}</span>
                    <span className="text-gray-900 dark:text-white font-medium">600 zł</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-brand-border pt-2.5 flex justify-between font-semibold">
                    <span className="text-gray-600 dark:text-neutral-400">{t('landing.hero.mock.total')}</span>
                    <span className="text-amber-500 text-lg">4 800 zł</span>
                  </div>
                </div>

                {/* Status with gradient */}
                <div className="bg-gradient-to-r from-amber-500/10 to-amber-400/5 border border-amber-500/20 rounded-xl p-3 text-center">
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    {t('landing.hero.mock.sentToClient')}
                  </span>
                </div>
              </div>

              {/* Second card — active projects */}
              <div className="mt-3 bg-white dark:bg-brand-card border border-gray-200 dark:border-brand-border rounded-xl p-4 shadow-lg shadow-gray-200/40 dark:shadow-black/40">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-gray-400 dark:text-neutral-600 text-xs mb-1">{t('landing.hero.mock.activeProjects')}</div>
                    <div className="text-gray-900 dark:text-white font-bold text-xl">12</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-brand-card dark:to-brand-dark flex items-center justify-center border border-gray-200 dark:border-brand-border">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-sm shadow-amber-500/30" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
