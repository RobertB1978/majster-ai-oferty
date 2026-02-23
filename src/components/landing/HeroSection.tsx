import { Link } from 'react-router-dom';
import { FileText, CheckCircle, ArrowDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const CTA_ROUTE = '/register';

function scrollToFeatures(e: React.MouseEvent<HTMLButtonElement>) {
  e.preventDefault();
  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function HeroSection() {
  const { t } = useTranslation();
  const STATS = [
    { label: t('landing.trust.pdfLabel', 'Wyceny PDF'), value: '✓', verified: true },
    { label: t('landing.trust.mobileLabel', 'Mobile-first'), value: '✓', verified: true },
    { label: t('landing.trust.langLabel', 'Języki'), value: 'PL / EN / UK', verified: true },
  ];
  const verifiedStats = STATS.filter((s) => s.verified);

  return (
    <section
      className="relative overflow-hidden bg-white dark:bg-[#0F0F0F] pt-24 pb-20 md:pt-32 md:pb-28"
      aria-label="Sekcja główna"
      style={{
        backgroundImage: `
          linear-gradient(rgba(245,158,11,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(245,158,11,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }}
    >
      {/* Amber radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(245,158,11,0.08) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left: copy + CTAs */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-500 dark:text-amber-400 mb-6">
              <CheckCircle className="w-4 h-4" aria-hidden="true" />
              {t('landing.hero.badge', 'Platforma dla wykonawców i majstrów')}
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight mb-6">
              {t('landing.hero.title1', 'Zarządzaj firmą')}{' '}
              <span className="text-amber-500">{t('landing.hero.title2', 'jak profesjonalista.')}</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 dark:text-[#A3A3A3] leading-relaxed max-w-2xl mx-auto lg:mx-0 mb-8">
              {t('landing.hero.subtitle', 'Platforma dla majstrów i wykonawców.')}
              <br className="hidden sm:block" />
              {t('landing.hero.subtitle2', 'Wyceny, projekty, klienci — wszystko w jednym miejscu.')}
            </p>

            {/* Verified stats bar */}
            {verifiedStats.length > 0 && (
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-8">
                {verifiedStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center gap-2 bg-gray-100 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-xl px-4 py-2"
                  >
                    <span className="text-amber-500 font-bold text-sm">{stat.value}</span>
                    <span className="text-gray-600 dark:text-[#A3A3A3] text-sm">{stat.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                to={CTA_ROUTE}
                className="inline-flex items-center justify-center bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-semibold px-8 py-4 rounded-xl text-base transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black min-h-[48px]"
              >
                {t('landing.hero.cta_start', 'Zacznij za darmo')}
              </Link>
              <button
                onClick={scrollToFeatures}
                className="inline-flex items-center justify-center border border-gray-300 dark:border-[#2A2A2A] hover:border-amber-500/60 text-gray-900 dark:text-white font-semibold px-8 py-4 rounded-xl text-base transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black min-h-[48px] gap-2"
              >
                {t('landing.hero.cta_features', 'Zobacz funkcje')}
                <ArrowDown className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-3 text-sm text-gray-400 dark:text-[#525252]">
              {t('landing.hero.microcopy', 'Pierwsze 30 dni bezpłatnie · Bez zobowiązań')}
            </p>
          </div>

          {/* Right: floating UI mock */}
          <div className="hidden lg:flex flex-col items-center shrink-0 w-72">
            <div
              className="animate-float w-full"
              style={{ animationDuration: '4s' }}
            >
              <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-5 shadow-xl shadow-gray-200/60 dark:shadow-black/50">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-amber-500" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-gray-900 dark:text-white text-sm font-semibold truncate">Wycena #042</div>
                    <div className="text-gray-400 dark:text-[#525252] text-xs">Remont łazienki</div>
                  </div>
                  <div className="ml-auto shrink-0">
                    <span className="text-xs bg-amber-500/20 text-amber-500 dark:text-amber-400 rounded-full px-2 py-0.5 font-medium">
                      PDF
                    </span>
                  </div>
                </div>

                {/* Line items */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-[#A3A3A3]">Robocizna</span>
                    <span className="text-gray-900 dark:text-white font-medium">2 400 zł</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-[#A3A3A3]">Materiały</span>
                    <span className="text-gray-900 dark:text-white font-medium">1 800 zł</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-[#A3A3A3]">Robocizna dodatkowa</span>
                    <span className="text-gray-900 dark:text-white font-medium">600 zł</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-[#2A2A2A] pt-2 flex justify-between font-semibold">
                    <span className="text-gray-600 dark:text-[#A3A3A3]">Razem</span>
                    <span className="text-amber-500 text-base">4 800 zł</span>
                  </div>
                </div>

                {/* Status */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
                  <span className="text-xs text-amber-500 dark:text-amber-400 font-medium">
                    ✓ Wysłano do klienta
                  </span>
                </div>
              </div>

              {/* Second smaller card */}
              <div className="mt-3 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-gray-400 dark:text-[#525252] text-xs mb-1">Projekty aktywne</div>
                    <div className="text-gray-900 dark:text-white font-bold text-xl">12</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#0F0F0F] flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full bg-amber-500" aria-hidden="true" />
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
