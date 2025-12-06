import { Helmet } from 'react-helmet-async';
import { FinanceDashboard } from '@/components/finance/FinanceDashboard';
import { TrendingUp } from 'lucide-react';

export default function Finance() {
  return (
    <>
      <Helmet>
        <title>Finanse | Majster.AI</title>
        <meta name="description" content="Zarządzaj finansami firmy, analizuj marże i cashflow" />
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Finanse firmy
          </h1>
          <p className="text-muted-foreground">
            Przegląd finansowy, analiza marż i cashflow
          </p>
        </div>

        <FinanceDashboard />
      </div>
    </>
  );
}
