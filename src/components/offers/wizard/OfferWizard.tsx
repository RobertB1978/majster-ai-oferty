/**
 * OfferWizard — PR-10
 *
 * 3-step wizard for creating/editing DRAFT offers.
 * Step 1: Client
 * Step 2: Items
 * Step 3: Review + Save
 *
 * Works with FF_NEW_SHELL ON/OFF (embedded in OfferDetail page).
 * Quota not checked here — drafts always allowed (PR-06 rule).
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import type { WizardFormData } from '@/hooks/useOfferWizard';
import { useLoadOfferDraft, useSaveDraft } from '@/hooks/useOfferWizard';

import { WizardStepClient } from './WizardStepClient';
import { WizardStepItems } from './WizardStepItems';
import { WizardStepReview } from './WizardStepReview';

import { Button } from '@/components/ui/button';
import { SkeletonList } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { cn } from '@/lib/utils';

// ── Validation ────────────────────────────────────────────────────────────────

function validateStep(step: number, form: WizardFormData): Record<string, string> {
  const errs: Record<string, string> = {};
  if (step === 0) {
    const hasExisting = !!form.clientId;
    const hasNew = !!form.newClient?.name?.trim();
    if (!hasExisting && !hasNew) {
      errs.client = 'Wybierz klienta lub podaj imię nowego klienta';
    }
    if (!hasExisting && form.newClient && !form.newClient.name.trim()) {
      errs.newClientName = 'Imię / nazwa firmy jest wymagana';
    }
  }
  if (step === 1) {
    if (form.items.length === 0) {
      errs.items = 'Dodaj co najmniej jedną pozycję';
    }
    const emptyName = form.items.find((it) => !it.name.trim());
    if (emptyName) errs.items = 'Każda pozycja musi mieć nazwę';
  }
  return errs;
}

// ── Initial state ─────────────────────────────────────────────────────────────

function emptyForm(offerId: string | null): WizardFormData {
  return {
    offerId,
    clientId: null,
    newClient: null,
    title: '',
    items: [],
  };
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  /** undefined = new offer, string = edit existing draft */
  offerId?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

const STEPS = ['offerWizard.steps.client', 'offerWizard.steps.items', 'offerWizard.steps.review'] as const;

export function OfferWizard({ offerId }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardFormData>(() => emptyForm(offerId ?? null));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load existing draft when editing
  const { data: existing, isLoading, isError, refetch } = useLoadOfferDraft(offerId ?? null);
  const saveDraft = useSaveDraft();

  // Populate form from loaded draft
  useEffect(() => {
    if (existing) {
      setForm({
        offerId: existing.id,
        clientId: existing.client_id,
        newClient: null,
        title: existing.title ?? '',
        items: existing.items,
      });
    }
  }, [existing]);

  const handleChange = (partial: Partial<WizardFormData>) => {
    setForm((prev) => ({ ...prev, ...partial }));
    setErrors({});
  };

  const handleNext = () => {
    const errs = validateStep(step, form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setErrors({});
    setStep((s) => s - 1);
  };

  const handleSave = async () => {
    setSaveError(null);
    const errs = validateStep(2, form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    try {
      await saveDraft.mutateAsync(form);
      toast.success(t('offerWizard.savedSuccess'));
      navigate('/app/offers');
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('offerWizard.saveErrorGeneric');
      setSaveError(msg);
    }
  };

  // Loading state (editing existing)
  if (offerId && isLoading) {
    return <SkeletonList rows={4} />;
  }

  if (offerId && isError) {
    return (
      <ErrorState
        title={t('offerWizard.loadError')}
        description={t('offerWizard.loadErrorDesc')}
        retryLabel={t('common.retry')}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <nav aria-label={t('offerWizard.stepsAriaLabel')} className="flex items-center gap-1">
        {STEPS.map((key, idx) => (
          <div key={key} className="flex items-center gap-1 flex-1 last:flex-none">
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0',
                idx < step
                  ? 'bg-primary text-primary-foreground'
                  : idx === step
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                  : 'bg-muted text-muted-foreground'
              )}
              aria-current={idx === step ? 'step' : undefined}
            >
              {idx + 1}
            </div>
            <span className={cn(
              'text-xs truncate',
              idx === step ? 'font-medium text-foreground' : 'text-muted-foreground'
            )}>
              {t(key)}
            </span>
            {idx < STEPS.length - 1 && (
              <div className="flex-1 h-px bg-border mx-1" />
            )}
          </div>
        ))}
      </nav>

      {/* Step content */}
      <div>
        {step === 0 && (
          <WizardStepClient form={form} onChange={handleChange} errors={errors} />
        )}
        {step === 1 && (
          <WizardStepItems form={form} onChange={handleChange} errors={errors} />
        )}
        {step === 2 && (
          <WizardStepReview
            form={form}
            onChange={handleChange}
            onSave={handleSave}
            isSaving={saveDraft.isPending}
            saveError={saveError}
            errors={errors}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between border-t border-border pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={step === 0 ? () => navigate('/app/offers') : handleBack}
        >
          {step === 0 ? t('common.cancel') : t('common.back')}
        </Button>
        {step < STEPS.length - 1 && (
          <Button type="button" onClick={handleNext}>
            {t('common.next')}
          </Button>
        )}
      </div>
    </div>
  );
}
