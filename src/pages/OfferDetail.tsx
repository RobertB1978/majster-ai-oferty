/**
 * OfferDetail — PR-10
 * Renders the OfferWizard for creating (/app/offers/new)
 * or editing (/app/offers/:id) a DRAFT offer.
 */
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';

import { OfferWizard } from '@/components/offers/wizard/OfferWizard';
import { Button } from '@/components/ui/button';

export default function OfferDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const isNew = !id;

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 pb-24">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2"
        onClick={() => navigate('/app/offers')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t('common.back')}
      </Button>

      <h1 className="text-2xl font-bold mb-6">
        {isNew ? t('offerWizard.titleNew') : t('offerWizard.titleEdit')}
      </h1>

      <OfferWizard offerId={id} />
    </div>
  );
}
