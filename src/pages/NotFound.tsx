import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.warn("404: Non-existent route:", location.pathname);
    }
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">
          {t('errors.pageNotFound', 'Strona nie została znaleziona')}
        </p>
        <Link to="/" className="text-primary underline hover:text-primary/90">
          {t('errors.returnHome', 'Wróć na stronę główną')}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
