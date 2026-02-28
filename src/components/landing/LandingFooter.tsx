import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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
    { to: '/legal/privacy', label: t('landing.footer.link_privacy', 'Polityka prywatności') },
    { to: '/legal/terms',   label: t('landing.footer.link_terms',   'Warunki korzystania') },
    { to: '/legal/cookies', label: t('landing.footer.link_cookies', 'Cookies') },
    { to: '/legal/dpa',     label: t('landing.footer.link_dpa',     'Umowa powierzenia') },
    { to: '/legal/rodo',    label: t('landing.footer.link_gdpr',    'RODO') },
  ];

  const PRODUCT_LINKS = [
    { to: '/register', label: t('landing.footer.link_register', 'Załóż konto') },
    { to: '/login',    label: t('landing.footer.link_login',    'Zaloguj się') },
    { to: '/plany',    label: t('landing.footer.link_pricing',  'Cennik') },
  ];

  return (
    <footer
      className="bg-white dark:bg-[#0F0F0F] border-t border-gray-200 dark:border-[#2A2A2A] pb-[env(safe-area-inset-bottom)]"
      aria-label={t('landing.footer.ariaLabel')}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Majster<span className="text-amber-500">.</span>AI
            </div>
            <p className="text-sm text-gray-500 dark:text-[#A3A3A3] leading-relaxed mb-3">
              {t('landing.footer.brand_desc', 'Platforma dla majstrów i wykonawców w Polsce.')}
            </p>
            <a
              href="mailto:kontakt@majster.ai"
              className="text-sm text-gray-500 dark:text-[#A3A3A3] hover:text-amber-500 dark:hover:text-amber-400 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
            >
              kontakt@majster.ai
            </a>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">
              {t('landing.footer.legal_title', 'Prawne')}
            </h4>
            <ul className="space-y-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-500 dark:text-[#A3A3A3] hover:text-amber-500 dark:hover:text-amber-400 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">
              {t('landing.footer.product_title', 'Produkt')}
            </h4>
            <ul className="space-y-2">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-500 dark:text-[#A3A3A3] hover:text-amber-500 dark:hover:text-amber-400 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Language switcher */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">
              {t('landing.footer.language_title', 'Język')}
            </h4>
            <div className="flex gap-2" role="group" aria-label={t('landing.header.languageSwitch')}>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`py-1.5 px-3 rounded-lg text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                    currentLang === lang.code
                      ? 'bg-gray-200 dark:bg-[#2A2A2A] text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-[#A3A3A3] hover:text-gray-900 dark:hover:text-white'
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
        <div className="border-t border-gray-200 dark:border-[#2A2A2A] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 dark:text-[#A3A3A3]">
            © {new Date().getFullYear()} Majster.AI. {t('landing.footer.copyright', 'Wszelkie prawa zastrzeżone.')}
          </p>
          <p className="text-sm text-gray-500 dark:text-[#A3A3A3]">
            {t('landing.footer.built_in', 'Zbudowane w Polsce 🇵🇱')}
          </p>
        </div>
      </div>
    </footer>
  );
}
