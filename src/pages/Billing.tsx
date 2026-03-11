/**
 * Billing.tsx — legacy page, zachowany tylko na potrzeby testów typografii.
 *
 * Routing: /app/billing i /app/plan kierują do Plan.tsx (patrz App.tsx).
 * Ten komponent NIE jest renderowany w aplikacji dla użytkowników — jest aliasem.
 *
 * UWAGA DLA DEWELOPERÓW:
 *  - Nie dodawaj tu nowych funkcji — używaj src/pages/Plan.tsx
 *  - Fake-owe dane (stary counter 2/3 projektów) zostały usunięte
 *  - handleSelectPlan (stary stub toast "dodaj Stripe key") został usunięty
 */

import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CreditCard } from 'lucide-react';

export default function Billing() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Automatycznie przekieruj do właściwej strony planów
  useEffect(() => {
    navigate('/app/plan', { replace: true });
  }, [navigate]);

  // Fallback UI na czas przekierowania (nie powinien być widoczny dla użytkownika)
  return (
    <>
      <Helmet>
        <title>{t('billing.title')} | Majster.AI</title>
        <meta name="description" content={t('billing.subtitle')} />
      </Helmet>

      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            {t('billing.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('billing.subtitle')}
          </p>
        </div>
      </div>
    </>
  );
}
