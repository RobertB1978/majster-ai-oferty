/**
 * AcceptanceChecklistPanel — PR-15
 *
 * Acceptance Checklist + Signature module for Project Hub.
 * Templates: plumbing_basic | electrical_basic | painting_basic | general_basic
 * Features:
 *  - Template selection (chips)
 *  - Check off items and save
 *  - Client signature via SignaturePad
 */

import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { CheckSquare2, Loader2, PenLine, ChevronDown, ChevronUp } from 'lucide-react';

import {
  useProjectChecklist,
  useUpsertProjectChecklist,
  CHECKLIST_TEMPLATES,
  TEMPLATE_DEFAULTS,
  type ChecklistTemplateKey,
  type ChecklistItem,
} from '@/hooks/useProjectChecklist';
import {
  useProjectAcceptance,
  useSaveSignature,
} from '@/hooks/useProjectAcceptance';
import { SignaturePad } from './SignaturePad';
import { Button } from '@/components/ui/button';
import { SkeletonList } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// ── TemplateSelector ──────────────────────────────────────────────────────────

function TemplateSelector({
  selected,
  onChange,
}: {
  selected: ChecklistTemplateKey;
  onChange: (key: ChecklistTemplateKey) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-2">
      {CHECKLIST_TEMPLATES.map((key) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cn(
            'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
            selected === key
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background border-border text-muted-foreground hover:border-primary/50'
          )}
        >
          {t(`checklist.template.${key}`)}
        </button>
      ))}
    </div>
  );
}

// ── ChecklistItems ────────────────────────────────────────────────────────────

function ChecklistItems({
  items,
  onChange,
}: {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
}) {
  const { t } = useTranslation();
  const doneCount = items.filter((i) => i.is_done).length;

  const toggleItem = (id: string) => {
    onChange(
      items.map((item) =>
        item.id === id ? { ...item, is_done: !item.is_done } : item
      )
    );
  };

  return (
    <div className="space-y-2">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{t('checklist.progress', { done: doneCount, total: items.length })}</span>
        <span className={cn('font-medium', doneCount === items.length && 'text-success')}>
          {doneCount === items.length && items.length > 0 ? t('checklist.allDone') : ''}
        </span>
      </div>

      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => toggleItem(item.id)}
              className={cn(
                'flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-md border text-sm transition-colors',
                item.is_done
                  ? 'bg-success/5 border-success/30 dark:bg-success/10 dark:border-success/40'
                  : 'bg-background border-border hover:bg-accent/30'
              )}
              aria-label={t('checklist.toggleItem', { label: t(item.label_key) })}
            >
              <span
                className={cn(
                  'h-4 w-4 shrink-0 rounded border-2 transition-colors',
                  item.is_done
                    ? 'border-success bg-success'
                    : 'border-muted-foreground'
                )}
              >
                {item.is_done && (
                  <svg viewBox="0 0 16 16" fill="none" className="text-white">
                    <path d="M3 8l4 4 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className={cn(item.is_done && 'line-through text-muted-foreground')}>
                {t(item.label_key)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── AcceptanceChecklistPanel ──────────────────────────────────────────────────

interface AcceptanceChecklistPanelProps {
  projectId: string;
}

export function AcceptanceChecklistPanel({ projectId }: AcceptanceChecklistPanelProps) {
  const { t } = useTranslation();
  const { data: checklist, isLoading: checklistLoading } = useProjectChecklist(projectId);
  const { data: acceptance, isLoading: acceptanceLoading } = useProjectAcceptance(projectId);
  const upsertChecklist = useUpsertProjectChecklist();
  const saveSignature = useSaveSignature();

  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplateKey>('general_basic');
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [showSignature, setShowSignature] = useState(false);
  const [savingChecklist, setSavingChecklist] = useState(false);

  // Initialize items from loaded checklist or default template
  useEffect(() => {
    if (checklist) {
      setSelectedTemplate(checklist.template_key as ChecklistTemplateKey);
      setItems(checklist.items_json as ChecklistItem[]);
    } else {
      setItems(TEMPLATE_DEFAULTS[selectedTemplate]);
    }
  }, [checklist]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTemplateChange = useCallback((key: ChecklistTemplateKey) => {
    setSelectedTemplate(key);
    // Reset to template defaults when switching (checklist saved separately)
    setItems(TEMPLATE_DEFAULTS[key]);
  }, []);

  const handleSaveChecklist = useCallback(async () => {
    setSavingChecklist(true);
    try {
      await upsertChecklist.mutateAsync({
        projectId,
        templateKey: selectedTemplate,
        items,
      });
      toast.success(t('checklist.saved'));
    } catch {
      toast.error(t('checklist.saveError'));
    } finally {
      setSavingChecklist(false);
    }
  }, [projectId, selectedTemplate, items, upsertChecklist, t]);

  const handleSaveSignature = useCallback(async (blob: Blob) => {
    try {
      await saveSignature.mutateAsync({ projectId, signatureBlob: blob });
      toast.success(t('signature.savedSuccess'));
    } catch {
      toast.error(t('signature.saveError'));
    }
  }, [projectId, saveSignature, t]);

  const isLoading = checklistLoading || acceptanceLoading;

  if (isLoading) {
    return <SkeletonList rows={4} />;
  }

  const doneCount = items.filter((i) => i.is_done).length;
  const allDone = items.length > 0 && doneCount === items.length;

  return (
    <div className="space-y-5">
      {/* Template picker */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {t('checklist.selectTemplate')}
        </p>
        <TemplateSelector selected={selectedTemplate} onChange={handleTemplateChange} />
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CheckSquare2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{t('checklist.items')}</span>
        </div>
        <ChecklistItems items={items} onChange={setItems} />
        <Button
          size="sm"
          variant="outline"
          onClick={handleSaveChecklist}
          disabled={savingChecklist}
          className="gap-1.5"
        >
          {savingChecklist ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {t('checklist.save')}
        </Button>
      </div>

      {/* Signature section */}
      <div className="border rounded-lg overflow-hidden">
        <button
          className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium hover:bg-accent/30 transition-colors"
          onClick={() => setShowSignature(!showSignature)}
          aria-expanded={showSignature}
        >
          <div className="flex items-center gap-2">
            <PenLine className="h-4 w-4 text-muted-foreground" />
            <span>{t('signature.title')}</span>
            {acceptance?.signature_path && (
              <span className="text-xs text-success font-normal">{t('signature.alreadySigned')}</span>
            )}
          </div>
          {showSignature ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {showSignature && (
          <div className="px-4 pb-4 pt-2 border-t">
            {!allDone && (
              <p className="text-xs text-warning mb-3">
                {t('signature.completeChecklistFirst', { remaining: items.length - doneCount })}
              </p>
            )}
            <SignaturePad
              onSave={handleSaveSignature}
              savedSignatureUrl={acceptance?.signatureUrl}
            />
          </div>
        )}
      </div>
    </div>
  );
}
