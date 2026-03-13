import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { FinanceDashboard } from '@/components/finance/FinanceDashboard';
import { TrendingUp } from 'lucide-react';

export default function Finance() {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>{t('finance.title')} | Majster.AI</title>
        <meta name="description" content={t('finance.subtitle')} />
      </Helmet>

      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success shadow-sm">
              <TrendingUp className="h-5 w-5 text-success-foreground" />
            </div>
            {t('finance.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('finance.subtitle')}
          </p>
        </div>

        <FinanceDashboard />
      </div>
    </>
  );
}