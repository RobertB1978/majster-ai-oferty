/**
 * OfferDetail — placeholder for PR-10 (Offer Wizard).
 * Routes: /app/offers/new, /app/offers/:id
 */
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfferDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate('/app/offers')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t('common.back')}
      </Button>
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold mb-2">{t('offersList.pageTitle')}</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          {t('nav.comingSoon')} — PR-10
        </p>
      </div>
    </div>
  );
}
