/**
 * Tests for src/components/field-capture/*
 *
 * Gate 1 Condition 1 — required test coverage per task spec.
 *
 * Covered:
 * - Each component renders without crash
 * - Empty states render correctly
 * - Note input triggers onChange callback
 * - Checklist toggles trigger correct callback payload
 * - Photo list renders and remove action works
 * - MeasurementInput add/remove rows
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@/test/utils';
import { PhotoCapture } from '@/components/field-capture/PhotoCapture';
import { TextNote } from '@/components/field-capture/TextNote';
import { ChecklistPanel } from '@/components/field-capture/ChecklistPanel';
import { MeasurementInput } from '@/components/field-capture/MeasurementInput';
import type { PhotoCapturePhoto } from '@/components/field-capture/PhotoCapture';
import type { OfferDraftChecklist } from '@/types/offer-draft';

// ── Helpers ────────────────────────────────────────────────────────────────────

function makePhoto(id: string): PhotoCapturePhoto {
  return { id, previewUrl: `https://example.com/${id}.jpg`, caption: null };
}

const defaultChecklist: OfferDraftChecklist = {
  hasDocumentation: 'unknown',
  hasInvestorEstimate: 'unknown',
  clientRequirements: null,
  siteConstraints: null,
};

// ── PhotoCapture ───────────────────────────────────────────────────────────────

describe('PhotoCapture', () => {
  it('renders without crash with empty photo list', () => {
    render(<PhotoCapture photos={[]} onAdd={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getAllByRole('region').length).toBeGreaterThanOrEqual(1);
  });

  it('shows empty state when no photos provided', () => {
    render(<PhotoCapture photos={[]} onAdd={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByText(/brak zdjęć/i)).toBeDefined();
  });

  it('renders photo thumbnails when photos are provided', () => {
    const photos = [makePhoto('p1'), makePhoto('p2')];
    render(<PhotoCapture photos={photos} onAdd={vi.fn()} onRemove={vi.fn()} />);
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
  });

  it('shows +N overflow indicator when photos exceed maxVisible', () => {
    const photos = [makePhoto('a'), makePhoto('b'), makePhoto('c'), makePhoto('d'), makePhoto('e')];
    render(<PhotoCapture photos={photos} onAdd={vi.fn()} onRemove={vi.fn()} maxVisible={4} />);
    // 4 images + "+1" indicator
    expect(screen.getByText('+1')).toBeDefined();
  });

  it('opens remove confirmation dialog when remove button is clicked', async () => {
    const photos = [makePhoto('p1')];
    render(<PhotoCapture photos={photos} onAdd={vi.fn()} onRemove={vi.fn()} />);

    const removeBtn = screen.getByTestId('remove-photo-p1');
    fireEvent.click(removeBtn);

    expect(screen.getByRole('alertdialog')).toBeDefined();
  });

  it('calls onRemove with the correct photo id after confirmation', async () => {
    const onRemove = vi.fn();
    const photos = [makePhoto('p1')];
    render(<PhotoCapture photos={photos} onAdd={vi.fn()} onRemove={onRemove} />);

    fireEvent.click(screen.getByTestId('remove-photo-p1'));
    // Query confirm button within the dialog to avoid matching aria-label "Usuń zdjęcie"
    const dialog = screen.getByRole('alertdialog');
    const confirmBtn = within(dialog).getByRole('button', { name: /usuń/i });
    fireEvent.click(confirmBtn);

    expect(onRemove).toHaveBeenCalledWith('p1');
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('closes dialog without calling onRemove when cancel is clicked', () => {
    const onRemove = vi.fn();
    const photos = [makePhoto('p1')];
    render(<PhotoCapture photos={photos} onAdd={vi.fn()} onRemove={onRemove} />);

    fireEvent.click(screen.getByTestId('remove-photo-p1'));
    fireEvent.click(screen.getByRole('button', { name: /anuluj/i }));

    expect(onRemove).not.toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('does not render empty state when photos are present', () => {
    render(<PhotoCapture photos={[makePhoto('x')]} onAdd={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.queryByText(/brak zdjęć/i)).toBeNull();
  });
});

// ── TextNote ──────────────────────────────────────────────────────────────────

describe('TextNote', () => {
  it('renders without crash', () => {
    render(<TextNote value="" onChange={vi.fn()} />);
    expect(screen.getByTestId('text-note-textarea')).toBeDefined();
  });

  it('shows empty state correctly (empty value, placeholder visible)', () => {
    render(<TextNote value="" onChange={vi.fn()} />);
    const textarea = screen.getByTestId('text-note-textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe('');
    expect(textarea.placeholder).toMatch(/opisz co widzisz/i);
  });

  it('displays the current value', () => {
    render(<TextNote value="Ściana pęknięta" onChange={vi.fn()} />);
    const textarea = screen.getByTestId('text-note-textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe('Ściana pęknięta');
  });

  it('calls onChange with new value when user types', () => {
    const onChange = vi.fn();
    render(<TextNote value="" onChange={onChange} />);
    const textarea = screen.getByTestId('text-note-textarea');
    fireEvent.change(textarea, { target: { value: 'Nowa notatka' } });
    expect(onChange).toHaveBeenCalledWith('Nowa notatka');
  });

  it('renders the label', () => {
    render(<TextNote value="" onChange={vi.fn()} />);
    expect(screen.getByText(/notatka z terenu/i)).toBeDefined();
  });

  it('accepts custom placeholder', () => {
    render(<TextNote value="" onChange={vi.fn()} placeholder="Wpisz coś" />);
    const textarea = screen.getByTestId('text-note-textarea') as HTMLTextAreaElement;
    expect(textarea.placeholder).toBe('Wpisz coś');
  });
});

// ── ChecklistPanel ────────────────────────────────────────────────────────────

describe('ChecklistPanel', () => {
  it('renders without crash', () => {
    render(<ChecklistPanel checklist={defaultChecklist} onChange={vi.fn()} />);
    expect(screen.getByText(/dokumentacja klienta/i)).toBeDefined();
  });

  it('renders all three fields', () => {
    render(<ChecklistPanel checklist={defaultChecklist} onChange={vi.fn()} />);
    expect(screen.getByText(/klient ma dokumentację/i)).toBeDefined();
    expect(screen.getByText(/jest kosztorys inwestorski/i)).toBeDefined();
    expect(screen.getByText(/wytyczne klienta/i)).toBeDefined();
  });

  it('calls onChange with updated hasDocumentation when TAK is clicked', () => {
    const onChange = vi.fn();
    render(<ChecklistPanel checklist={defaultChecklist} onChange={onChange} />);

    fireEvent.click(screen.getByTestId('doc-yes'));

    expect(onChange).toHaveBeenCalledWith({
      ...defaultChecklist,
      hasDocumentation: 'yes',
    });
  });

  it('calls onChange with updated hasDocumentation when NIE is clicked', () => {
    const onChange = vi.fn();
    render(<ChecklistPanel checklist={defaultChecklist} onChange={onChange} />);

    fireEvent.click(screen.getByTestId('doc-no'));

    expect(onChange).toHaveBeenCalledWith({
      ...defaultChecklist,
      hasDocumentation: 'no',
    });
  });

  it('calls onChange with updated hasDocumentation when CZEKAM is clicked', () => {
    const onChange = vi.fn();
    render(<ChecklistPanel checklist={defaultChecklist} onChange={onChange} />);

    fireEvent.click(screen.getByTestId('doc-waiting'));

    expect(onChange).toHaveBeenCalledWith({
      ...defaultChecklist,
      hasDocumentation: 'waiting',
    });
  });

  it('calls onChange with updated hasInvestorEstimate when SPRAWDZAM is clicked', () => {
    const onChange = vi.fn();
    render(<ChecklistPanel checklist={defaultChecklist} onChange={onChange} />);

    fireEvent.click(screen.getByTestId('est-checking'));

    expect(onChange).toHaveBeenCalledWith({
      ...defaultChecklist,
      hasInvestorEstimate: 'checking',
    });
  });

  it('calls onChange with clientRequirements string when text is entered', () => {
    const onChange = vi.fn();
    render(<ChecklistPanel checklist={defaultChecklist} onChange={onChange} />);

    fireEvent.change(screen.getByTestId('checklist-requirements'), {
      target: { value: 'Klient chce białe ściany' },
    });

    expect(onChange).toHaveBeenCalledWith({
      ...defaultChecklist,
      clientRequirements: 'Klient chce białe ściany',
    });
  });

  it('sets clientRequirements to null when requirements text is cleared', () => {
    const onChange = vi.fn();
    const checklist = { ...defaultChecklist, clientRequirements: 'istniejąca notatka' };
    render(<ChecklistPanel checklist={checklist} onChange={onChange} />);

    fireEvent.change(screen.getByTestId('checklist-requirements'), {
      target: { value: '' },
    });

    expect(onChange).toHaveBeenCalledWith({
      ...checklist,
      clientRequirements: null,
    });
  });
});

// ── MeasurementInput ──────────────────────────────────────────────────────────

describe('MeasurementInput', () => {
  it('renders without crash', () => {
    render(<MeasurementInput measurements={[]} onChange={vi.fn()} />);
    expect(screen.getByText(/pomiary/i)).toBeDefined();
  });

  it('shows empty state when no measurements provided', () => {
    render(<MeasurementInput measurements={[]} onChange={vi.fn()} />);
    expect(screen.getByTestId('measurement-empty')).toBeDefined();
  });

  it('renders add button', () => {
    render(<MeasurementInput measurements={[]} onChange={vi.fn()} />);
    expect(screen.getByTestId('add-measurement')).toBeDefined();
  });

  it('calls onChange with new blank row when add is clicked', () => {
    const onChange = vi.fn();
    render(<MeasurementInput measurements={[]} onChange={onChange} />);

    fireEvent.click(screen.getByTestId('add-measurement'));

    expect(onChange).toHaveBeenCalledWith([{ label: '', value: 0, unit: 'm2' }]);
  });

  it('renders measurement rows when measurements are provided', () => {
    const measurements = [
      { label: 'Ściana', value: 10, unit: 'm2' as const },
      { label: 'Podłoga', value: 5, unit: 'm2' as const },
    ];
    render(<MeasurementInput measurements={measurements} onChange={vi.fn()} />);

    expect(screen.getByTestId('measurement-row-0')).toBeDefined();
    expect(screen.getByTestId('measurement-row-1')).toBeDefined();
  });

  it('calls onChange without the removed row when remove is clicked', () => {
    const onChange = vi.fn();
    const measurements = [
      { label: 'A', value: 1, unit: 'm' as const },
      { label: 'B', value: 2, unit: 'm2' as const },
    ];
    render(<MeasurementInput measurements={measurements} onChange={onChange} />);

    fireEvent.click(screen.getByTestId('remove-measurement-0'));

    expect(onChange).toHaveBeenCalledWith([{ label: 'B', value: 2, unit: 'm2' }]);
  });

  it('does not show empty state when rows are present', () => {
    render(
      <MeasurementInput
        measurements={[{ label: 'X', value: 1, unit: 'm' }]}
        onChange={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('measurement-empty')).toBeNull();
  });
});

// ── Barrel export ─────────────────────────────────────────────────────────────

describe('field-capture barrel export', () => {
  it('exports PhotoCapture', async () => {
    const mod = await import('@/components/field-capture');
    expect(typeof mod.PhotoCapture).toBe('function');
  });

  it('exports TextNote', async () => {
    const mod = await import('@/components/field-capture');
    expect(typeof mod.TextNote).toBe('function');
  });

  it('exports ChecklistPanel', async () => {
    const mod = await import('@/components/field-capture');
    expect(typeof mod.ChecklistPanel).toBe('function');
  });

  it('exports MeasurementInput', async () => {
    const mod = await import('@/components/field-capture');
    expect(typeof mod.MeasurementInput).toBe('function');
  });
});
