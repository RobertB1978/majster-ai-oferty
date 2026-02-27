import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { X, Menu, Sun, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';

const CTA_ROUTE = '/register';

// All 3 locales confirmed: src/i18n/locales/pl.json + en.json + uk.json
const LANGUAGES = [
  { code: 'pl', label: 'PL', flag: '🇵🇱' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'uk', label: 'UK', flag: '🇺🇦' },
];

function scrollTo(id: string) {
  return (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
}

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { i18n, t } = useTranslation();
  const NAV_ITEMS = [
    { label: t('landing.nav.features', 'Funkcje'),    id: 'features'     },
    { label: t('landing.nav.howItWorks', 'Jak działa'), id: 'how-it-works' },
    { label: t('landing.nav.pricing', 'Ceny'),        id: 'pricing'      },
    { label: t('landing.nav.faq', 'FAQ'),             id: 'faq'          },
  ];
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    if (!drawerOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [drawerOpen, closeDrawer]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    document.documentElement.lang = code;
  };

  const currentLang = LANGUAGES.find(
    (l) => i18n.language === l.code || i18n.language.startsWith(l.code)
  )?.code ?? 'pl';

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'backdrop-blur-md bg-white/90 dark:bg-black/80 border-b border-gray-200 dark:border-[#2A2A2A]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-1 text-xl font-bold text-gray-900 dark:text-white tracking-tight shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black rounded"
            aria-label="Majster.AI — strona główna"
          >
            Majster
            <span className="text-amber-500">.</span>
            AI
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-x-6 flex-nowrap" aria-label="Nawigacja główna">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={scrollTo(item.id)}
                className="text-sm font-medium text-gray-600 dark:text-[#A3A3A3] hover:text-amber-500 dark:hover:text-amber-400 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black rounded"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right side controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Language switcher */}
            <div
              className="hidden sm:flex items-center gap-0.5 rounded-lg border border-gray-200 dark:border-[#2A2A2A] bg-gray-100/80 dark:bg-[#1A1A1A]/60 p-0.5"
              role="group"
              aria-label="Wybór języka"
            >
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`rounded px-2 py-1 text-xs font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                    currentLang === lang.code
                      ? 'bg-gray-200 dark:bg-[#2A2A2A] text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-[#A3A3A3] hover:text-gray-900 dark:hover:text-white'
                  }`}
                  aria-label={`Zmień język na ${lang.label}`}
                  aria-pressed={currentLang === lang.code}
                >
                  {lang.flag} {lang.label}
                </button>
              ))}
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 dark:border-[#2A2A2A] text-gray-600 dark:text-[#A3A3A3] hover:text-gray-900 dark:hover:text-white hover:border-amber-500/40 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              aria-label={isDark ? t('landing.header.switchToLight') : t('landing.header.switchToDark')}
            >
              {isDark ? (
                <Sun className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4" aria-hidden="true" />
              )}
            </button>

            <Link
              to="/login"
              className="hidden sm:inline-flex items-center text-sm font-medium text-gray-600 dark:text-[#A3A3A3] hover:text-gray-900 dark:hover:text-white transition-colors duration-200 px-3 py-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black"
            >
              {t('landing.nav.login', 'Zaloguj się')}
            </Link>

            <Link
              to={CTA_ROUTE}
              className="inline-flex items-center bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-semibold px-4 py-2 rounded-xl text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black min-h-[44px]"
            >
              {t('landing.nav.getStarted', 'Zacznij za darmo')}
            </Link>

            {/* Hamburger */}
            <button
              className="md:hidden flex items-center justify-center w-11 h-11 rounded-xl border border-gray-200 dark:border-[#2A2A2A] text-gray-600 dark:text-[#A3A3A3] hover:text-gray-900 dark:hover:text-white hover:border-amber-500/40 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              onClick={() => setDrawerOpen(true)}
              aria-label="Otwórz menu nawigacyjne"
              aria-expanded={drawerOpen}
              aria-controls="mobile-drawer"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={closeDrawer}
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        </div>
      )}

      {/* Mobile drawer */}
      <div
        id="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menu nawigacyjne"
        className={`fixed top-0 right-0 bottom-0 z-[51] w-72 bg-white dark:bg-[#0F0F0F] border-l border-gray-200 dark:border-[#2A2A2A] transform transition-transform duration-300 md:hidden ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#2A2A2A]">
          <span className="text-gray-900 dark:text-white font-bold text-lg">
            Majster<span className="text-amber-500">.</span>AI
          </span>
          <button
            onClick={closeDrawer}
            className="flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 dark:text-[#A3A3A3] hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1A1A1A] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            aria-label="Zamknij menu"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="p-4 flex flex-col gap-1" aria-label="Menu mobilne">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => { scrollTo(item.id)(e); closeDrawer(); }}
              className="px-4 py-3 rounded-xl text-gray-600 dark:text-[#A3A3A3] hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1A1A1A] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-[#2A2A2A] flex flex-col gap-3">
          {/* Language switcher mobile */}
          <div className="flex gap-1" role="group" aria-label="Wybór języka">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => { changeLanguage(lang.code); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  currentLang === lang.code
                    ? 'bg-gray-200 dark:bg-[#2A2A2A] text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-[#A3A3A3] hover:text-gray-900 dark:hover:text-white'
                }`}
                aria-label={`Zmień język na ${lang.label}`}
                aria-pressed={currentLang === lang.code}
              >
                {lang.flag} {lang.label}
              </button>
            ))}
          </div>

          {/* Theme toggle mobile */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-gray-200 dark:border-[#2A2A2A] text-gray-600 dark:text-[#A3A3A3] hover:text-gray-900 dark:hover:text-white hover:border-amber-500/40 transition-colors duration-200 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            aria-label={isDark ? t('landing.header.switchToLight') : t('landing.header.switchToDark')}
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4" aria-hidden="true" />
                {t('landing.header.lightTheme')}
              </>
            ) : (
              <>
                <Moon className="w-4 h-4" aria-hidden="true" />
                {t('landing.header.darkTheme')}
              </>
            )}
          </button>

          <Link
            to="/login"
            onClick={closeDrawer}
            className="block text-center py-3 px-4 rounded-xl border border-gray-200 dark:border-[#2A2A2A] text-gray-900 dark:text-white font-medium hover:border-amber-500/40 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            {t('landing.nav.login', 'Zaloguj się')}
          </Link>
          <Link
            to={CTA_ROUTE}
            onClick={closeDrawer}
            className="block text-center py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            {t('landing.nav.getStarted', 'Zacznij za darmo')}
          </Link>
        </div>
      </div>
    </>
  );
}
