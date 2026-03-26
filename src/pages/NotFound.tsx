import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    if (import.meta.env.DEV) {
      const warn = console.warn.bind(console);
      warn("404: Non-existent route:", location.pathname);
    }
  }, [location.pathname]);

  return (
    <>
      <Helmet>
        <title>{t('seo.notFound.title')}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
        <div className="max-w-md">
          {/* Construction-themed 404 illustration */}
          <div className="mb-8 flex justify-center">
            <svg
              viewBox="0 0 240 200"
              className="w-60 h-auto"
              aria-hidden="true"
              role="img"
            >
              {/* Ground */}
              <rect x="0" y="170" width="240" height="30" rx="4" fill="var(--bg-surface-raised, #F5F3EF)" />

              {/* Construction barrier — left */}
              <rect x="30" y="130" width="8" height="40" rx="2" fill="var(--accent-amber, #F59E0B)" />
              <rect x="62" y="130" width="8" height="40" rx="2" fill="var(--accent-amber, #F59E0B)" />
              {/* Barrier stripe */}
              <rect x="28" y="135" width="44" height="10" rx="3" fill="var(--accent-amber, #F59E0B)" />
              <rect x="28" y="150" width="44" height="10" rx="3" fill="var(--text-primary, #111827)" opacity="0.15" />

              {/* Construction barrier — right */}
              <rect x="170" y="130" width="8" height="40" rx="2" fill="var(--accent-amber, #F59E0B)" />
              <rect x="202" y="130" width="8" height="40" rx="2" fill="var(--accent-amber, #F59E0B)" />
              <rect x="168" y="135" width="44" height="10" rx="3" fill="var(--accent-amber, #F59E0B)" />
              <rect x="168" y="150" width="44" height="10" rx="3" fill="var(--text-primary, #111827)" opacity="0.15" />

              {/* Hard hat on "4" */}
              <ellipse cx="120" cy="42" rx="32" ry="12" fill="var(--accent-amber, #F59E0B)" />
              <rect x="88" y="30" width="64" height="14" rx="7" fill="var(--accent-amber, #F59E0B)" />

              {/* 404 text */}
              <text
                x="120"
                y="110"
                textAnchor="middle"
                fontFamily="'Bricolage Grotesque', system-ui, sans-serif"
                fontWeight="800"
                fontSize="72"
                fill="var(--text-primary, #111827)"
                opacity="0.12"
              >
                404
              </text>

              {/* Small cone */}
              <polygon points="120,125 112,170 128,170" fill="var(--accent-amber, #F59E0B)" opacity="0.7" />
              <rect x="112" y="165" width="16" height="6" rx="2" fill="var(--text-primary, #111827)" opacity="0.15" />

              {/* Animated floating dust */}
              <circle cx="80" cy="160" r="2" fill="var(--accent-amber, #F59E0B)" opacity="0.3">
                <animate attributeName="cy" values="160;154;160" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx="160" cy="155" r="1.5" fill="var(--accent-amber, #F59E0B)" opacity="0.25">
                <animate attributeName="cy" values="155;148;155" dur="4s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>

          <h1 className="mb-3 text-2xl font-display font-bold text-[var(--text-primary)]">
            {t('errors.pageNotFound')}
          </h1>
          <p className="mb-8 text-base text-[var(--text-secondary)] leading-relaxed">
            {t('errors.pageNotFoundDesc')}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 bg-[var(--accent-amber)] hover:bg-[var(--accent-amber-hover)] text-black font-semibold px-6 py-3 rounded-token-md text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-amber)] focus-visible:ring-offset-2 min-h-[44px] shadow-amber hover:shadow-amber-lg"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              {t('errors.returnHome')}
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 border border-[var(--border-default)] hover:border-[var(--accent-amber)] text-[var(--text-primary)] font-medium px-6 py-3 rounded-token-md text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-amber)] focus-visible:ring-offset-2 min-h-[44px]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {t('errors.goBack')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
