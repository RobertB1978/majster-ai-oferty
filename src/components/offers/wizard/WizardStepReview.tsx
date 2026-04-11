/**
 * WizardStepReview — PR-10 Step 3 (extended in PR-11, offer-versioning-7RcU5)
 * Display totals and save the draft.
 * PR-11: Added "Preview & Send" button that saves draft then opens OfferPreviewModal.
 * offer-versioning-7RcU5: Shows per-variant totals when variants exist.
 * Drafts are always allowed — quota applies only to SEND (ADR-0004).
 */
import { useTranslation } from 'react-i18next';
import { CheckCircle, Eye, Send, Layers } from 'lucide-react';

import type { WizardFormData } from '@/hooks/useOfferWizard';
import { computeTotals, computeTotalsForItems } from '@/hooks/useOfferWizard';

import { useClients } from '@/hooks/useClients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatNumber } from '@/lib/formatters';

interface Props {
  form: WizardFormData;
  onChange: (partial: Partial<WizardFormData>) => void;
  onSave: () => void;
  /** PR-11: Saves draft then opens PDF preview + send modal */
  onPreviewAndSend?: () => void;
  isSaving: boolean;
  saveError: string | null;
  errors: Record<string, string>;
}

function formatMoney(val: number, language?: string): string {
  return formatNumber(val, 2, language);
}

export function WizardStepReview({ form, onChange, onSave, onPreviewAndSend, isSaving, saveError, errors }: Props) {
  const { t, i18n } = useTranslation();
  const totals = computeTotals(form);
  const { data: allClients = [] } = useClients();
  const selectedClient = allClients.find((c) => c.id === form.clientId);
  const hasVariants = form.variants.length > 0;

  const clientName = selectedClient?.name ?? form.newClient?.name ?? '—';

  return (
    <div className="space-y-4">
      {/* Offer title */}
      <div className="space-y-1">
        <Label htmlFor="offer-title">{t('offerWizard.reviewStep.title')}</Label>
        <Input
          id="offer-title"
          value={form.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder={t('offerWizard.reviewStep.titlePlaceholder')}
        />
        {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-border divide-y divide-border text-sm">
        <div className="flex justify-between px-4 py-2.5">
          <span className="text-muted-foreground">{t('offerWizard.reviewStep.client')}</span>
          <span className="font-medium text-right max-w-[55%] truncate">{clientName}</span>
        </div>

        {/* No-variant summary */}
        {!hasVariants && (
          <>
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-muted-foreground">{t('offerWizard.reviewStep.itemCount')}</span>
              <span className="font-medium">{form.items.length}</span>
            </div>
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-muted-foreground">{t('common.net')}</span>
              <span className="font-medium">{formatMoney(totals.total_net, i18n.language)} zł</span>
            </div>
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-muted-foreground">VAT</span>
              <span>{formatMoney(totals.total_vat, i18n.language)} zł</span>
            </div>
            <div className="flex justify-between px-4 py-2.5 bg-muted rounded-b-lg">
              <span className="font-semibold">{t('common.gross')}</span>
              <span className="font-bold text-lg">{formatMoney(totals.total_gross, i18n.language)} zł</span>
            </div>
          </>
        )}

        {/* Per-variant summary */}
        {hasVariants && form.variants.map((v, idx) => {
          const vTotals = computeTotalsForItems(v.items);
          return (
            <div key={v.localId} className="px-4 py-2.5 space-y-1">
              <div className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium text-sm">{v.label}</span>
                <span className="text-xs text-muted-foreground">({v.items.length} {t('offerWizard.reviewStep.items')})</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground pl-5">
                <span>{t('common.net')}</span>
                <span>{formatMoney(vTotals.total_net, i18n.language)} zł</span>
              </div>
              <div className={`flex justify-between text-sm font-semibold pl-5 ${idx === form.variants.length - 1 ? '' : ''}`}>
                <span>{t('common.gross')}</span>
                <span>{formatMoney(vTotals.total_gross, i18n.language)} zł</span>
              </div>
            </div>
          );
        })}

        {hasVariants && (
          <div className="px-4 py-2.5 bg-muted rounded-b-lg">
            <p className="text-xs text-muted-foreground">{t('offerWizard.reviewStep.variantTotalsNote')}</p>
          </div>
        )}
      </div>

      {/* Draft info */}
      <div className="flex items-start gap-2 rounded-md bg-info/5 dark:bg-info/10 p-3 text-sm text-info">
        <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
        <p>{t('offerWizard.reviewStep.draftInfo')}</p>
      </div>

      {/* Error */}
      {saveError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {saveError}
        </div>
      )}

      {/* Actions — PR-11: two buttons */}
      <div className="flex flex-col gap-2 sm:flex-row">
        {/* Save Draft (always available) */}
        <Button
          type="button"
          variant="outline"
          onClick={onSave}
          disabled={isSaving}
          className="flex-1"
        >
          {isSaving ? t('offerWizard.reviewStep.saving') : t('offerWizard.reviewStep.saveDraft')}
        </Button>

        {/* Preview & Send (PR-11) */}
        {onPreviewAndSend && (
          <Button
            type="button"
            onClick={onPreviewAndSend}
            disabled={isSaving}
            className="flex-1"
          >
            <Eye className="mr-2 h-4 w-4" />
            <Send className="mr-1 h-3 w-3" />
            {t('offerWizard.reviewStep.previewAndSend')}
          </Button>
        )}
      </div>
    </div>
  );
}
