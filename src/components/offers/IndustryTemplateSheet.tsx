/**
 * IndustryTemplateSheet
 *
 * A slide-up Sheet (mobile-friendly) that shows the TradeCatalogPicker.
 * When the user selects a starter pack, it creates a DRAFT offer pre-filled
 * with all industry-standard items and prices, then opens the offer wizard.
 *
 * "Szablony branżowe z AI — wycena jednym kliknięciem"
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Loader2, Clock, Target, Info, Building2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TradeCatalogPicker } from '@/components/quickEstimate/TradeCatalogPicker';
import { useCreateOfferFromTemplate } from '@/hooks/useCreateOfferFromTemplate';
import type { StarterPack, TemplateComplexity } from '@/data/starterPacks';
import { formatNumberCompact } from '@/lib/formatters';

interface IndustryTemplateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COMPLEXITY_CONFIG: Record<
  TemplateComplexity,
  { labelKey: string; className: string }
> = {
  prosta: {
    labelKey: 'industryTemplates.complexitySimple',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  standardowa: {
    labelKey: 'industryTemplates.complexityStandard',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  złożona: {
    labelKey: 'industryTemplates.complexityComplex',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
};

function ComplexityBadge({ complexity }: { complexity: TemplateComplexity }) {
  const { t } = useTranslation();
  const cfg = COMPLEXITY_CONFIG[complexity];
  return (
    <Badge className={`text-xs font-medium px-2 py-0.5 ${cfg.className}`}>
      {t(cfg.labelKey)}
    </Badge>
  );
}

export function IndustryTemplateSheet({ open, onOpenChange }: IndustryTemplateSheetProps) {
  const { t, i18n } = useTranslation();
  const { createFromTemplate, isCreating } = useCreateOfferFromTemplate();
  const [selectedPack, setSelectedPack] = useState<StarterPack | null>(null);

  const handleSelectPack = (pack: StarterPack) => {
    setSelectedPack(pack);
  };

  const handleCreate = async () => {
    if (!selectedPack) return;
    try {
      await createFromTemplate(selectedPack);
      onOpenChange(false);
      setSelectedPack(null);
    } catch {
      toast.error(t('industryTemplates.createError'));
    }
  };

  const handleBack = () => {
    if (selectedPack) {
      setSelectedPack(null);
    } else {
      onOpenChange(false);
    }
  };

  const estimatedTotal = selectedPack
    ? Math.round(selectedPack.items.reduce((s, i) => s + i.qty * i.price, 0))
    : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-base">
                {t('industryTemplates.sheetTitle')}
              </SheetTitle>
              <SheetDescription className="text-xs">
                {t('industryTemplates.sheetDesc')}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Pack selected — premium confirmation view */}
        {selectedPack ? (
          <div className="space-y-4 pb-6">
            {/* Main card */}
            <div className="rounded-xl border bg-card p-4 space-y-3">
              {/* Title + complexity */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-tight">{selectedPack.tradeName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedPack.description}</p>
                </div>
                <ComplexityBadge complexity={selectedPack.complexity} />
              </div>

              {/* Best for */}
              <div className="flex items-start gap-2">
                <Target className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-foreground">
                  <span className="font-medium">{t('industryTemplates.bestFor')}: </span>
                  {selectedPack.bestFor}
                </p>
              </div>

              {/* Duration */}
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground">
                  {t('industryTemplates.estimatedDuration')}: {selectedPack.estimatedDuration}
                </p>
              </div>

              {/* Stats row */}
              <div className="flex gap-4 pt-1 border-t border-border/50">
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    {t('industryTemplates.itemCount', { count: selectedPack.items.length })}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    {t('industryTemplates.estimatedTotal', {
                      value: formatNumberCompact(estimatedTotal, i18n.language),
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Starter notes */}
            {selectedPack.starterNotes && (
              <div className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2.5">
                <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {selectedPack.starterNotes}
                </p>
              </div>
            )}

            {/* Media readiness note (C4) */}
            <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
              <Building2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-primary/80">
                {t('industryTemplates.mediaReadyNote')}
              </p>
            </div>

            {/* Edit hint */}
            <p className="text-xs text-muted-foreground text-center">
              {t('industryTemplates.confirmHint')}
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleBack}
                disabled={isCreating}
              >
                {t('common.back')}
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleCreate}
                disabled={isCreating}
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {isCreating
                  ? t('industryTemplates.creating')
                  : t('industryTemplates.createOffer')}
              </Button>
            </div>
          </div>
        ) : (
          /* No pack selected — show catalog picker */
          <div className="pb-6">
            <TradeCatalogPicker onSelectPack={handleSelectPack} onBack={() => onOpenChange(false)} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
