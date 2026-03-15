/**
 * MeasurementInput — list of dimensional measurements for field capture.
 *
 * Presentational + controlled component. No persistence logic.
 * Parent supplies measurements array and onChange handler.
 *
 * Gate 1 Condition 1 — src/components/field-capture/MeasurementInput.tsx
 * Roadmap §2.2: touch targets ≥ 48px | §3.7: amber focus ring
 *
 * Implementation note: kept intentionally minimal (P1 — low-risk delta).
 * Advanced features (voice input for values, unit conversion) are deferred P2.
 */

import { useCallback, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { DraftMeasurement, MeasurementUnit } from '@/types/offer-draft';

// ── Constants ─────────────────────────────────────────────────────────────────

const UNITS: MeasurementUnit[] = ['m', 'm2', 'm3', 'pcs', 'mb'];

// ── Public types ──────────────────────────────────────────────────────────────

export interface MeasurementInputProps {
  measurements: DraftMeasurement[];
  /** Called with the complete updated array on every change. */
  onChange: (measurements: DraftMeasurement[]) => void;
  disabled?: boolean;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MeasurementInput renders an ordered list of label / value / unit rows
 * plus an "Add measurement" button that appends a blank row.
 */
export function MeasurementInput({
  measurements,
  onChange,
  disabled = false,
  className,
}: MeasurementInputProps) {
  const { t } = useTranslation();
  const titleId = useId();

  const handleAdd = useCallback(() => {
    onChange([...measurements, { label: '', value: 0, unit: 'm2' }]);
  }, [measurements, onChange]);

  const handleRemove = useCallback(
    (index: number) => {
      onChange(measurements.filter((_, i) => i !== index));
    },
    [measurements, onChange],
  );

  const handleChange = useCallback(
    (index: number, field: keyof DraftMeasurement, raw: string) => {
      const updated = measurements.map((m, i) => {
        if (i !== index) return m;
        if (field === 'value') {
          const parsed = parseFloat(raw);
          return { ...m, value: isNaN(parsed) ? 0 : parsed };
        }
        return { ...m, [field]: raw };
      });
      onChange(updated);
    },
    [measurements, onChange],
  );

  return (
    <div className={cn('space-y-3', className)} aria-labelledby={titleId}>
      <h3 id={titleId} className="text-sm font-semibold text-[var(--text-primary)]">
        {t('fieldCapture.measurement.title')}
      </h3>

      {measurements.length === 0 && (
        <p className="text-sm text-[var(--text-secondary)]" data-testid="measurement-empty">
          {t('fieldCapture.measurement.empty')}
        </p>
      )}

      {measurements.map((m, index) => (
        <MeasurementRow
          key={index}
          measurement={m}
          index={index}
          onChange={handleChange}
          onRemove={handleRemove}
          disabled={disabled}
        />
      ))}

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full min-h-[48px] border-dashed"
        onClick={handleAdd}
        disabled={disabled}
        data-testid="add-measurement"
      >
        <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
        {t('fieldCapture.measurement.addMeasurement')}
      </Button>
    </div>
  );
}

// ── MeasurementRow (internal) ─────────────────────────────────────────────────

interface MeasurementRowProps {
  measurement: DraftMeasurement;
  index: number;
  onChange: (index: number, field: keyof DraftMeasurement, value: string) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

const inputBase = cn(
  'flex h-10 w-full rounded-[var(--radius-sm)] border border-[var(--border-default)]',
  'bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)]',
  'placeholder:text-[var(--text-secondary)]',
  'focus-visible:outline-none focus-visible:ring-2',
  'focus-visible:ring-[var(--accent-amber)] focus-visible:ring-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-50',
);

function MeasurementRow({
  measurement,
  index,
  onChange,
  onRemove,
  disabled,
}: MeasurementRowProps) {
  const { t } = useTranslation();
  const labelId = useId();
  const valueId = useId();

  return (
    <div className="flex gap-2 items-center" data-testid={`measurement-row-${index}`}>
      {/* Label input — flex-1 */}
      <div className="flex-1">
        <label htmlFor={labelId} className="sr-only">
          {t('fieldCapture.measurement.label')}
        </label>
        <input
          id={labelId}
          type="text"
          value={measurement.label}
          onChange={(e) => onChange(index, 'label', e.target.value)}
          placeholder={t('fieldCapture.measurement.labelPlaceholder')}
          disabled={disabled}
          className={inputBase}
          data-testid={`measurement-label-${index}`}
        />
      </div>

      {/* Numeric value — fixed 20 */}
      <div className="w-20 shrink-0">
        <label htmlFor={valueId} className="sr-only">
          {t('fieldCapture.measurement.value')}
        </label>
        <input
          id={valueId}
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={measurement.value === 0 ? '' : measurement.value}
          onChange={(e) => onChange(index, 'value', e.target.value)}
          disabled={disabled}
          className={inputBase}
          data-testid={`measurement-value-${index}`}
        />
      </div>

      {/* Unit select — fixed 24 */}
      <div className="w-24 shrink-0">
        <label className="sr-only">{t('fieldCapture.measurement.unit')}</label>
        <select
          value={measurement.unit}
          onChange={(e) => onChange(index, 'unit', e.target.value)}
          disabled={disabled}
          aria-label={t('fieldCapture.measurement.unit')}
          className={cn(inputBase, 'px-2 appearance-none')}
          data-testid={`measurement-unit-${index}`}
        >
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {t(`fieldCapture.measurement.units.${u}`)}
            </option>
          ))}
        </select>
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={() => onRemove(index)}
        disabled={disabled}
        aria-label={t('fieldCapture.measurement.removeMeasurement')}
        className={cn(
          'h-10 w-10 shrink-0 rounded-[var(--radius-sm)]',
          'flex items-center justify-center',
          'text-[var(--text-secondary)]',
          'hover:text-[var(--state-error)] hover:bg-red-50 dark:hover:bg-red-950/20',
          'focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-[var(--accent-amber)] focus-visible:ring-offset-2',
          'transition-colors duration-[var(--motion-fast)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
        data-testid={`remove-measurement-${index}`}
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
