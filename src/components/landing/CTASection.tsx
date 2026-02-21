import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const CTA_ROUTE = '/register';

export function CTASection() {
  const { t } = useTranslation();

  return (
    <section
      className="relative overflow-hidden py-20 md:py-28"
      aria-labelledby="cta-heading"
      style={{
        background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 50%, #FBBF24 100%)',
      }}
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
          className="text-3xl md:text-4xl font-bold text-black mb-4"
        >
          {t('landing.cta.heading', 'Gotowy na cyfrową transformację?')}
        </h2>
        <p className="text-lg text-black/70 max-w-xl mx-auto mb-8 leading-relaxed">
          {t('landing.cta.desc', 'Zacznij bezpłatnie przez 30 dni.')}
          <br className="hidden sm:block" />
          {t('landing.cta.desc2', 'Dołącz do wykonawców, którzy zarządzają firmą cyfrowo.')}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={CTA_ROUTE}
            className="inline-flex items-center justify-center bg-black hover:bg-[#1A1A1A] text-white font-semibold px-8 py-4 rounded-xl text-base transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-amber-500 min-h-[48px] gap-2"
          >
            {t('landing.cta.cta_start', 'Zacznij za darmo')}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center border-2 border-black/30 hover:border-black/60 text-black font-semibold px-8 py-4 rounded-xl text-base transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-amber-500 min-h-[48px]"
          >
            {t('landing.cta.cta_login', 'Mam już konto')}
          </Link>
        </div>

        <p className="mt-4 text-sm text-black/50">
          {t('landing.cta.microcopy', 'Bez zobowiązań · Anuluj w każdej chwili')}
        </p>
      </div>
    </section>
  );
}
