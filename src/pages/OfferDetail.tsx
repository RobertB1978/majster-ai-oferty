/**
 * OfferDetail — PR-10 (extended in PR-12)
 *
 * - DRAFT offers → shows OfferWizard for editing
 * - SENT / ACCEPTED / REJECTED offers → shows offer header + AcceptanceLinkPanel
 *
 * New in PR-12: AcceptanceLinkPanel for managing public acceptance links.
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Loader2, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { OfferWizard } from '@/components/offers/wizard/OfferWizard';
import { AcceptanceLinkPanel } from '@/components/offers/AcceptanceLinkPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ── Offer meta loader ─────────────────────────────────────────────────────────

interface OfferMeta {
  id: string;
  status: string;
  title: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
}

function useOfferMeta(offerId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['offerMeta', offerId],
    queryFn: async (): Promise<OfferMeta> => {
      const { data, error } = await supabase
        .from('offers')
        .select('id, status, title, accepted_at, rejected_at')
        .eq('id', offerId!)
        .single();
      if (error) throw error;
      return data as OfferMeta;
    },
    enabled: !!offerId && !!user,
    staleTime: 10_000,
  });
}

// ── Status badge helpers ──────────────────────────────────────────────────────

const STATUS_BADGE_CLASSES: Record<string, string> = {
  DRAFT:    'bg-muted text-muted-foreground',
  SENT:     'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ACCEPTED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  ARCHIVED: 'bg-secondary text-secondary-foreground',
};

const STATUS_I18N_KEYS: Record<string, string> = {
  DRAFT:    'offersList.statusDraft',
  SENT:     'offersList.statusSent',
  ACCEPTED: 'offersList.statusAccepted',
  REJECTED: 'offersList.statusRejected',
  ARCHIVED: 'offersList.statusArchived',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function OfferDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const isNew = !id;
  const { data: meta, isLoading: metaLoading } = useOfferMeta(id);

  if (isNew) {
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
        <h1 className="text-2xl font-bold mb-6">{t('offerWizard.titleNew')}</h1>
        <OfferWizard offerId={undefined} />
      </div>
    );
  }

  if (metaLoading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>{t('common.loading')}</span>
      </div>
    );
  }

  if (!meta || meta.status === 'DRAFT') {
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
        <h1 className="text-2xl font-bold mb-6">{t('offerWizard.titleEdit')}</h1>
        <OfferWizard offerId={id} />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2"
        onClick={() => navigate('/app/offers')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t('common.back')}
      </Button>

      <div className="flex items-center gap-2 flex-wrap">
        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
        <h1 className="text-xl font-bold">
          {meta.title ?? t('offersList.noTitle')}
        </h1>
        <Badge className={STATUS_BADGE_CLASSES[meta.status] ?? ''}>
          {t(STATUS_I18N_KEYS[meta.status] ?? 'offersList.statusDraft')}
        </Badge>
      </div>

      {/* PR-12: Acceptance link management panel */}
      <AcceptanceLinkPanel
        offerId={meta.id}
        offerStatus={meta.status}
        acceptedAt={meta.accepted_at}
        rejectedAt={meta.rejected_at}
      />
    </div>
  );
}
