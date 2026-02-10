import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { FinanceDashboard } from '@/components/finance/FinanceDashboard';
import { TrendingUp, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Finance() {
  const { t } = useTranslation();
  
  return (
    <>
      <Helmet>
        <title>{t('finance.title')} | Majster.AI</title>
        <meta name="description" content={t('finance.subtitle')} />
      </Helmet>

      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
          <div className="flex gap-2">
            <Button variant="outline" className="hover:bg-primary/5">
              <FileText className="mr-2 h-4 w-4" />
              {t('finance.exportPdf')}
            </Button>
            <Button variant="outline" className="hover:bg-primary/5">
              <Download className="mr-2 h-4 w-4" />
              {t('finance.exportExcel')}
            </Button>
          </div>
        </div>

        <FinanceDashboard />
      </div>
    </>
  );
}