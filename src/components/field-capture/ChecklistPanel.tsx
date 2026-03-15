/**
 * ChecklistPanel — Quick Mode client-scoping checklist.
 *
 * Exactly three fields as per Section 19.1 of ULTRA_ENTERPRISE_ROADMAP.md:
 *   1. hasDocumentation  → TAK / NIE / CZEKAM
 *   2. hasInvestorEstimate → TAK / NIE / SPRAWDZAM
 *   3. clientRequirements → optional free text
 *
 * Presentational + controlled component. No backend calls.
 * Parent supplies checklist state and onChange handler.
 *
 * Gate 1 Condition 1 — src/components/field-capture/ChecklistPanel.tsx
 * Roadmap §2.2: touch targets ≥ 48px | §3.7: amber focus ring
 */

import { useCallback, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type {
  DocumentationStatus,
  InvestorEstimateStatus,
  OfferDraftChecklist,
} from '@/types/offer-draft';

// ── Public types ──────────────────────────────────────────────────────────────

export interface ChecklistPanelProps {
  checklist: OfferDraftChecklist;
  /** Called with the full updated checklist whenever any field changes. */
  onChange: (updated: OfferDraftChecklist) => void;
  disabled?: boolean;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * ChecklistPanel renders two segmented controls + one optional textarea.
 * Segmented controls use role="group" + role="radio" for screen-reader support.
 */
export function ChecklistPanel({
  checklist,
  onChange,
  disabled = false,
  className,
}: ChecklistPanelProps) {
  const { t } = useTranslation();
  const reqId = useId();

  // ── Option definitions ──────────────────────────────────────────────────────

  const docOptions: { value: DocumentationStatus; labelKey: string }[] = [
    { value: 'yes', labelKey: 'fieldCapture.checklist.yes' },
    { value: 'no', labelKey: 'fieldCapture.checklist.no' },
    { value: 'waiting', labelKey: 'fieldCapture.checklist.waiting' },
  ];

  const estOptions: { value: InvestorEstimateStatus; labelKey: string }[] = [
    { value: 'yes', labelKey: 'fieldCapture.checklist.yes' },
    { value: 'no', labelKey: 'fieldCapture.checklist.no' },
    { value: 'checking', labelKey: 'fieldCapture.checklist.checking' },
  ];

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleDocChange = useCallback(
    (value: DocumentationStatus) => {
      onChange({ ...checklist, hasDocumentation: value });
    },
    [checklist, onChange],
  );

  const handleEstChange = useCallback(
    (value: InvestorEstimateStatus) => {
      onChange({ ...checklist, hasInvestorEstimate: value });
    },
    [checklist, onChange],
  );

  const handleReqChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange({ ...checklist, clientRequirements: e.target.value || null });
    },
    [checklist, onChange],
  );

  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">
        {t('fieldCapture.checklist.title')}
      </h3>

      {/* 1. Has documentation? */}
      <SegmentedField
        label={t('fieldCapture.checklist.hasDocumentation')}
        options={docOptions.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
        value={checklist.hasDocumentation}
        onChange={handleDocChange}
        disabled={disabled}
        testIdPrefix="doc"
      />

      {/* 2. Has investor estimate? */}
      <SegmentedField
        label={t('fieldCapture.checklist.hasInvestorEstimate')}
        options={estOptions.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
        value={checklist.hasInvestorEstimate}
        onChange={handleEstChange}
        disabled={disabled}
        testIdPrefix="est"
      />

      {/* 3. Client requirements — free text */}
      <div className="space-y-1">
        <label
          htmlFor={reqId}
          className="text-sm font-medium text-[var(--text-primary)]"
        >
          {t('fieldCapture.checklist.clientRequirements')}
        </label>
        <textarea
          id={reqId}
          value={checklist.clientRequirements ?? ''}
          onChange={handleReqChange}
          placeholder={t('fieldCapture.checklist.clientRequirementsPlaceholder')}
          rows={2}
          disabled={disabled}
          data-testid="checklist-requirements"
          className={cn(
            'flex w-full rounded-[var(--radius-sm)] border border-[var(--border-default)]',
            'bg-[var(--bg-surface)] px-3 py-2',
            'text-sm text-[var(--text-primary)] resize-none',
            'placeholder:text-[var(--text-secondary)]',
            'transition-all duration-[var(--motion-base)]',
            'focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-[var(--accent-amber)] focus-visible:ring-offset-2',
            'focus-visible:border-[var(--accent-amber)]',
            'hover:border-[var(--text-secondary)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'min-h-[48px]',
          )}
        />
      </div>
    </div>
  );
}

// ── SegmentedField (internal) ─────────────────────────────────────────────────

interface SegmentedFieldProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  /** Prefix used for data-testid attributes. */
  testIdPrefix?: string;
}

/**
 * A labelled row of toggle buttons that behave like a radio group.
 * Uses role="group" + role="radio" + aria-checked for accessibility.
 */
function SegmentedField<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled,
  testIdPrefix,
}: SegmentedFieldProps<T>) {
  const groupId = useId();

  return (
    <div className="space-y-1.5">
      <p id={groupId} className="text-sm font-medium text-[var(--text-primary)]">
        {label}
      </p>
      <div role="group" aria-labelledby={groupId} className="flex gap-1.5">
        {options.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              data-testid={testIdPrefix ? `${testIdPrefix}-${opt.value}` : undefined}
              className={cn(
                // Layout
                'flex-1 min-h-[48px] px-2 rounded-[var(--radius-sm)]',
                'text-xs font-semibold border',
                'transition-all duration-[var(--motion-base)]',
                // Amber focus ring §3.7
                'focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-[var(--accent-amber)] focus-visible:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
                // Active vs. inactive state
                isSelected
                  ? 'bg-[var(--accent-amber)] text-white border-[var(--accent-amber)] shadow-[var(--shadow-amber)]'
                  : [
                      'bg-[var(--bg-surface)] text-[var(--text-secondary)]',
                      'border-[var(--border-default)]',
                      'hover:border-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                    ],
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
