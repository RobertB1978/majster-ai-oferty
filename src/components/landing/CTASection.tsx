import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics';

const CTA_ROUTE = '/register';

export function CTASection() {
  const { t } = useTranslation();

  return (
    <section
      className="relative overflow-hidden py-20 md:py-28 bg-gradient-to-br from-amber-600 via-amber-500 to-amber-400"
      aria-labelledby="cta-heading"
    >
      {/* Subtle texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2
          id="cta-heading"
          className="text-3xl md:text-5xl font-bold text-black mb-4 leading-tight"
        >
          {t('landing.cta.heading')}
          <br />
          <span className="text-black/70 text-2xl md:text-3xl font-medium">
            {t('landing.cta.subheading')}
          </span>
        </h2>
        <p className="text-lg text-black/70 max-w-xl mx-auto mb-8 leading-relaxed">
          {t('landing.cta.desc')}
          <br className="hidden sm:block" />
          <strong className="text-black/90">
            {t('landing.cta.desc2')}
          </strong>
        </p>

        {/* Trust signals */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <div className="flex items-center gap-2 bg-black/10 rounded-full px-4 py-2">
            <Shield className="w-4 h-4 text-black/70" aria-hidden="true" />
            <span className="text-sm font-medium text-black/80">
              {t('landing.cta.trust1')}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-black/10 rounded-full px-4 py-2">
            <Zap className="w-4 h-4 text-black/70" aria-hidden="true" />
            <span className="text-sm font-medium text-black/80">
              {t('landing.cta.trust2')}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={CTA_ROUTE}
            onClick={() => trackEvent(ANALYTICS_EVENTS.LANDING_CTA_CLICK, { source: 'cta_section' })}
            className="inline-flex items-center justify-center bg-black hover:bg-brand-card text-white font-semibold px-10 py-4 rounded-xl text-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-amber-500 min-h-[56px] gap-2 shadow-lg shadow-black/20"
          >
            {t('landing.cta.cta_start')}
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center border-2 border-black/30 hover:border-black/60 text-black font-semibold px-8 py-4 rounded-xl text-base transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-amber-500 min-h-[56px]"
          >
            {t('landing.cta.cta_login')}
          </Link>
        </div>

        <p className="mt-4 text-sm text-black/50">
          {t('landing.cta.microcopy')}
        </p>
      </div>
    </section>
  );
}
