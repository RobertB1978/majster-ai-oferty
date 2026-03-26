import { Link } from 'react-router-dom';
import { CheckCircle, ArrowDown, Shield, Smartphone, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import HeroComposition from '@/components/illustrations/HeroComposition';

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

          {/* Right: HeroComposition — isometric SVG (Faza 5) */}
          <div className="hidden lg:flex items-center justify-center shrink-0 w-[420px]">
            <HeroComposition className="w-full max-w-[420px] drop-shadow-xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
