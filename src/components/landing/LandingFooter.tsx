import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'pl', label: 'PL', flag: '🇵🇱' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'uk', label: 'UK', flag: '🇺🇦' },
];

// LandingFooter renders ONLY on the landing page (Landing.tsx)
// It must NOT appear inside AppLayout or AdminLayout routes
export function LandingFooter() {
  const { i18n } = useTranslation();

  const currentLang = LANGUAGES.find(
    (l) => i18n.language === l.code || i18n.language.startsWith(l.code)
  )?.code ?? 'pl';

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    document.documentElement.lang = code;
  };

  return (
    <footer
      className="bg-[#0F0F0F] border-t border-[#2A2A2A] pb-[env(safe-area-inset-bottom)]"
      aria-label="Stopka strony"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="text-xl font-bold text-white mb-3">
              Majster<span className="text-amber-500">.</span>AI
            </div>
            <p className="text-sm text-[#525252] leading-relaxed mb-3">
              Platforma dla majstrów i wykonawców w Polsce.
            </p>
            <a
              href="mailto:kontakt@majster.ai"
              className="text-sm text-[#A3A3A3] hover:text-amber-400 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
            >
              kontakt@majster.ai
            </a>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Prawne</h4>
            <ul className="space-y-2">
              {[
                { to: '/legal/privacy', label: 'Polityka prywatności' },
                { to: '/legal/terms', label: 'Warunki korzystania' },
                { to: '/legal/cookies', label: 'Cookies' },
                { to: '/legal/dpa', label: 'Umowa powierzenia' },
                { to: '/legal/rodo', label: 'RODO' },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-[#525252] hover:text-amber-400 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Produkt</h4>
            <ul className="space-y-2">
              {[
                { to: '/register', label: 'Załóż konto' },
                { to: '/login', label: 'Zaloguj się' },
                { to: '/plany', label: 'Cennik' },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-[#525252] hover:text-amber-400 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Language switcher */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Język</h4>
            <div className="flex gap-2" role="group" aria-label="Wybór języka">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`py-1.5 px-3 rounded-lg text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                    currentLang === lang.code
                      ? 'bg-[#2A2A2A] text-white'
                      : 'text-[#525252] hover:text-white'
                  }`}
                  aria-label={`Zmień język na ${lang.label}`}
                  aria-pressed={currentLang === lang.code}
                >
                  {lang.flag} {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#2A2A2A] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[#525252]">
            © {new Date().getFullYear()} Majster.AI. Wszelkie prawa zastrzeżone.
          </p>
          <p className="text-sm text-[#525252]">
            Zbudowane w Polsce 🇵🇱
          </p>
        </div>
      </div>
    </footer>
  );
}
