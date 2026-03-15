/**
 * TextNote — auto-expanding textarea for field notes.
 *
 * Presentational + controlled component. No persistence logic inside.
 * Parent supplies value and onChange callback.
 *
 * Gate 1 Condition 1 — src/components/field-capture/TextNote.tsx
 * Roadmap §2.2: touch targets ≥ 48px | §3.7: amber focus ring | §0.4: visible on first screen
 */

import { useCallback, useRef, useEffect, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

// ── Public types ──────────────────────────────────────────────────────────────

export interface TextNoteProps {
  value: string;
  /** Called on every keystroke with the new text value. */
  onChange: (value: string) => void;
  /** Override the default placeholder text. */
  placeholder?: string;
  disabled?: boolean;
  /**
   * Minimum visible rows before content causes expansion.
   * Default: 3 (matches roadmap minimum).
   */
  minRows?: number;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * TextNote renders a single auto-expanding textarea with a visible label.
 * Height grows with content — no scroll bar unless externally constrained.
 *
 * Designed for first-screen placement (no menu, no collapsing).
 */
export function TextNote({
  value,
  onChange,
  placeholder,
  disabled = false,
  minRows = 3,
  className,
}: TextNoteProps) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const labelId = useId();

  /** Recalculate textarea height to match its content. */
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  // Re-run whenever value changes (e.g. programmatic updates from draft restore)
  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
      adjustHeight();
    },
    [onChange, adjustHeight],
  );

  // Derive a CSS min-height string from the requested row count.
  // 1.5rem line-height + 0.75rem top/bottom padding (py-3 = 12px × 2 = 24px = 1.5rem).
  const minHeightRem = minRows * 1.5 + 1.5;

  return (
    <div className={cn('space-y-1', className)}>
      <label
        id={labelId}
        className="text-sm font-medium text-[var(--text-primary)]"
      >
        {t('fieldCapture.note.label')}
      </label>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        placeholder={placeholder ?? t('fieldCapture.note.placeholder')}
        disabled={disabled}
        rows={minRows}
        aria-labelledby={labelId}
        aria-label={t('fieldCapture.note.ariaLabel')}
        style={{ minHeight: `${minHeightRem}rem` }}
        className={cn(
          'flex w-full rounded-[var(--radius-sm)] border border-[var(--border-default)]',
          'bg-[var(--bg-surface)] px-3 py-3',
          'text-sm text-[var(--text-primary)]',
          'placeholder:text-[var(--text-secondary)]',
          // Auto-expand: no resize handle, overflow hidden while height matches content
          'resize-none overflow-hidden',
          'transition-all duration-[var(--motion-base)]',
          // Amber focus ring per §3.7
          'focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-[var(--accent-amber)] focus-visible:ring-offset-2',
          'focus-visible:border-[var(--accent-amber)]',
          'hover:border-[var(--text-secondary)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          // Ensure tappable — especially when nearly empty
          'min-h-[48px]',
        )}
        data-testid="text-note-textarea"
      />
    </div>
  );
}
