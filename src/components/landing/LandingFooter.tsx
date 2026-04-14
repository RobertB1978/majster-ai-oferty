import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Cookie } from 'lucide-react';

const LANGUAGES = [
  { code: 'pl', label: 'PL', flag: '🇵🇱' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'uk', label: 'UK', flag: '🇺🇦' },
];

// LandingFooter renders ONLY on the landing page (Landing.tsx)
export function LandingFooter() {
  const { t, i18n } = useTranslation();

  const currentLang = LANGUAGES.find(
    (l) => i18n.language === l.code || i18n.language.startsWith(l.code)
  )?.code ?? 'pl';

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    document.documentElement.lang = code;
  };

  const LEGAL_LINKS = [
    { to: '/legal/privacy', label: t('landing.footer.link_privacy') },
    { to: '/legal/terms',   label: t('landing.footer.link_terms') },
    { to: '/legal/cookies', label: t('landing.footer.link_cookies') },
    { to: '/legal/dpa',     label: t('landing.footer.link_dpa') },
    { to: '/legal/rodo',    label: t('landing.footer.link_gdpr') },
  ];

  const PRODUCT_LINKS = [
    { to: '/register', label: t('landing.footer.link_register') },
    { to: '/login',    label: t('landing.footer.link_login') },
    { to: '/plany',    label: t('landing.footer.link_pricing') },
  ];

  return (
    <footer
      className="bg-gray-50 dark:bg-neutral-950 border-t border-gray-200 dark:border-brand-border pb-[env(safe-area-inset-bottom)]"
      aria-label={t('landing.footer.ariaLabel')}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="text-xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
              Majster<span className="text-accent-amber">.</span>AI
            </div>
            <p className="text-sm text-gray-500 dark:text-neutral-400 leading-relaxed mb-3">
              {t('landing.footer.brand_desc')}
            </p>
            <a
              href="mailto:kontakt@majster.ai"
              className="text-sm text-gray-500 dark:text-neutral-400 hover:text-accent-amber transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber rounded"
            >
              kontakt@majster.ai
            </a>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-4 uppercase tracking-wider text-xs">
              {t('landing.footer.legal_title')}
            </h4>
            <ul className="space-y-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-500 dark:text-neutral-400 hover:text-accent-amber transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber rounded"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-4 uppercase tracking-wider text-xs">
              {t('landing.footer.product_title')}
            </h4>
            <ul className="space-y-2">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-500 dark:text-neutral-400 hover:text-accent-amber transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber rounded"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Language switcher */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-4 uppercase tracking-wider text-xs">
              {t('landing.footer.language_title')}
            </h4>
            <div className="flex gap-2" role="group" aria-label={t('landing.header.languageSwitch')}>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`py-1.5 px-3 rounded-lg text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                    currentLang === lang.code
                      ? 'bg-gray-200 dark:bg-brand-border text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  aria-label={t('landing.header.changeLangTo', { lang: lang.label })}
                  aria-pressed={currentLang === lang.code}
                >
                  {lang.flag} {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-200 dark:border-brand-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 dark:text-neutral-400">
            © {new Date().getFullYear()} Majster.AI. {t('landing.footer.copyright')}
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-neutral-400">
            <p>{t('landing.footer.built_in')}</p>
            <span>•</span>
            <button
              className="hover:text-accent-amber transition-colors underline underline-offset-2"
              onClick={() => { localStorage.removeItem('cookie_consent'); window.location.reload(); }}
            >
              <Cookie className="inline h-3 w-3 mr-1" />
              {t('cookies.changeSettings')}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
