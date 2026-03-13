import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { Home, ArrowLeft, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    if (import.meta.env.DEV) {
      // Only log in development mode
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
          {/* Visual */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="text-8xl font-black text-gray-100 dark:text-gray-800 select-none">
                404
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Search className="h-14 w-14 text-amber-500/60" aria-hidden="true" />
              </div>
            </div>
          </div>

          <h1 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
            {t('errors.pageNotFound')}
          </h1>
          <p className="mb-8 text-base text-muted-foreground leading-relaxed">
            {t('errors.pageNotFoundDesc')}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-semibold px-6 py-3 rounded-xl text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 min-h-[44px]"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              {t('errors.returnHome')}
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 border border-border hover:border-amber-500/60 text-foreground font-medium px-6 py-3 rounded-xl text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 min-h-[44px]"
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
