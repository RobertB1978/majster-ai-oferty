/**
 * OfferDetail — PR-10 (extended in PR-12, Sprint D, Sprint E)
 *
 * - DRAFT offers → shows OfferWizard for editing
 * - SENT / ACCEPTED / REJECTED offers → shows offer header + AcceptanceLinkPanel
 *
 * Sprint D: Show template origin badge when offer was created from an industry starter pack.
 * Sprint E: Add TemplateRecoveryCard + TemplateDetailSheet for full template continuity.
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Loader2, FileText, Sparkles, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { OfferWizard } from '@/components/offers/wizard/OfferWizard';
import { AcceptanceLinkPanel } from '@/components/offers/AcceptanceLinkPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { getStarterPack } from '@/data/starterPacks';
import type { StarterPack } from '@/data/starterPacks';

// ── Offer meta loader ─────────────────────────────────────────────────────────

interface OfferMeta {
  id: string;
  status: string;
  title: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  source_template_id: string | null;
}

function useOfferMeta(offerId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['offerMeta', offerId],
    queryFn: async (): Promise<OfferMeta> => {
      const { data, error } = await supabase
        .from('offers')
        .select('id, status, title, accepted_at, rejected_at, source_template_id')
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

// ── TemplateDetailSheet ───────────────────────────────────────────────────────

interface TemplateDetailSheetProps {
  pack: StarterPack;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function TemplateDetailSheet({ pack, open, onOpenChange }: TemplateDetailSheetProps) {
  const materialItems = pack.items.filter(i => i.category === 'Materiał');
  const laborItems   = pack.items.filter(i => i.category === 'Robocizna');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            {pack.tradeName}
          </SheetTitle>
          <SheetDescription>{pack.description}</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 mt-5">
          {/* Meta */}
          <div className="rounded-md bg-muted/50 p-3 space-y-1.5 text-sm">
            <p>
              <span className="text-muted-foreground">Przeznaczenie: </span>
              {pack.bestFor}
            </p>
            <p>
              <span className="text-muted-foreground">Czas realizacji: </span>
              {pack.estimatedDuration}
            </p>
            <p>
              <span className="text-muted-foreground">Złożoność: </span>
              {pack.complexity}
            </p>
          </div>

          {/* Starter notes */}
          {pack.starterNotes && (
            <div>
              <p className="text-[11px] font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide">
                Notatki startowe
              </p>
              <p className="text-sm leading-relaxed">{pack.starterNotes}</p>
            </div>
          )}

          {/* Materials */}
          {materialItems.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                Materiały ({materialItems.length})
              </p>
              <ul className="space-y-0.5">
                {materialItems.map((item, i) => (
                  <li key={i} className="flex justify-between text-xs py-1.5 border-b border-border/50 last:border-0">
                    <span className="flex-1 mr-3">{item.name}</span>
                    <span className="text-muted-foreground shrink-0">{item.qty} {item.unit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Labor */}
          {laborItems.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                Robocizna ({laborItems.length})
              </p>
              <ul className="space-y-0.5">
                {laborItems.map((item, i) => (
                  <li key={i} className="flex justify-between text-xs py-1.5 border-b border-border/50 last:border-0">
                    <span className="flex-1 mr-3">{item.name}</span>
                    <span className="text-muted-foreground shrink-0">{item.qty} {item.unit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── TemplateRecoveryCard ──────────────────────────────────────────────────────

interface TemplateRecoveryCardProps {
  pack: StarterPack;
  onViewDetails: () => void;
}

function TemplateRecoveryCard({ pack, onViewDetails }: TemplateRecoveryCardProps) {
  const materialCount = pack.items.filter(i => i.category === 'Materiał').length;
  const laborCount    = pack.items.filter(i => i.category === 'Robocizna').length;

  return (
    <div
      className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2"
      data-testid="template-recovery-card"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
          <span className="font-medium text-sm truncate">{pack.tradeName}</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 h-7 text-xs gap-1.5"
          onClick={onViewDetails}
          aria-label={`Podgląd szablonu ${pack.tradeName}`}
        >
          <Eye className="h-3 w-3" />
          Podgląd szablonu
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">{pack.description}</p>

      {pack.starterNotes && (
        <p className="text-xs text-muted-foreground line-clamp-2 italic">{pack.starterNotes}</p>
      )}

      <p className="text-xs text-muted-foreground font-medium">
        {materialCount} materiałów · {laborCount} poz. robocizny
      </p>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function OfferDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Sprint E: sheet state must be declared unconditionally (hooks rule)
  const [templateSheetOpen, setTemplateSheetOpen] = useState(false);

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

  // Sprint D3 / Sprint E: resolve template pack for continuity UI
  const templatePack = meta?.source_template_id
    ? getStarterPack(meta.source_template_id)
    : undefined;

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
        <div className="flex items-center gap-2 flex-wrap mb-6">
          <h1 className="text-2xl font-bold">{t('offerWizard.titleEdit')}</h1>
          {templatePack && (
            <>
              <Badge className="text-xs gap-1 bg-primary/10 text-primary border-primary/20">
                <Sparkles className="h-3 w-3" />
                {templatePack.tradeName}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                onClick={() => setTemplateSheetOpen(true)}
                aria-label={`Podgląd szablonu ${templatePack.tradeName}`}
              >
                <Eye className="h-3 w-3" />
                Podgląd
              </Button>
            </>
          )}
        </div>
        <OfferWizard offerId={id} />
        {/* Sheet renders in portal — safe to place here */}
        {templatePack && (
          <TemplateDetailSheet
            pack={templatePack}
            open={templateSheetOpen}
            onOpenChange={setTemplateSheetOpen}
          />
        )}
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
        {templatePack && (
          <Badge className="text-xs gap-1 bg-primary/10 text-primary border-primary/20">
            <Sparkles className="h-3 w-3" />
            {templatePack.tradeName}
          </Badge>
        )}
      </div>

      {/* Sprint E: Template recovery card — shown only when offer has template origin */}
      {templatePack && (
        <TemplateRecoveryCard
          pack={templatePack}
          onViewDetails={() => setTemplateSheetOpen(true)}
        />
      )}

      {/* Sprint E: Template detail sheet */}
      {templatePack && (
        <TemplateDetailSheet
          pack={templatePack}
          open={templateSheetOpen}
          onOpenChange={setTemplateSheetOpen}
        />
      )}

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
