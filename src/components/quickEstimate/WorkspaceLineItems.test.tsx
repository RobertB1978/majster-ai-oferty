import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import {
  WorkspaceLineItems,
} from './WorkspaceLineItems';
import type { LineItem } from './WorkspaceLineItems';

// Keep BulkAddModal out of scope — we test WorkspaceLineItems in isolation
vi.mock('./BulkAddModal', () => ({
  BulkAddModal: () => null,
}));

/* ── helpers ───────────────────────────────────────────────── */

function createItems(count: number): LineItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${i}`,
    name: `Pozycja ${i + 1}`,
    qty: 1,
    unit: 'szt',
    price: 100,
  }));
}

/** Controlled wrapper so tests can supply initial items */
function Wrapper({ initialItems }: { initialItems: LineItem[] }) {
  const [items, setItems] = useState(initialItems);
  return (
    <WorkspaceLineItems
      items={items}
      setItems={setItems}
      vatEnabled={false}
      onToggleVat={() => {}}
    />
  );
}

/* ── tests ─────────────────────────────────────────────────── */

describe('WorkspaceLineItems — pagination', () => {
  it('does NOT show pagination controls for ≤50 items', () => {
    render(<Wrapper initialItems={createItems(50)} />);
    expect(screen.queryByTestId('pagination-controls')).toBeNull();
  });

  it('shows pagination controls when items count exceeds 50', () => {
    render(<Wrapper initialItems={createItems(51)} />);
    expect(screen.getByTestId('pagination-controls')).toBeDefined();
  });

  it('renders only 50 rows on the first page for 200 items', () => {
    render(<Wrapper initialItems={createItems(200)} />);
    const nameInputs = screen.getAllByPlaceholderText('np. Kafelkowanie ściany');
    expect(nameInputs).toHaveLength(50);
  });

  it('shows correct range label on page 1 of 2 (51 items)', () => {
    render(<Wrapper initialItems={createItems(51)} />);
    expect(screen.getByText('Pozycje 1–50 z 51')).toBeDefined();
  });

  it('shows correct page indicator "1 / 4" for 200 items', () => {
    render(<Wrapper initialItems={createItems(200)} />);
    expect(screen.getByText('1 / 4')).toBeDefined();
  });

  it('previous button is disabled on first page', () => {
    render(<Wrapper initialItems={createItems(51)} />);
    const prevBtn = screen.getByRole('button', { name: /poprzednia strona/i }) as HTMLButtonElement;
    expect(prevBtn.disabled).toBe(true);
  });

  it('navigates to next page and updates range label', () => {
    render(<Wrapper initialItems={createItems(51)} />);
    fireEvent.click(screen.getByRole('button', { name: /następna strona/i }));
    expect(screen.getByText('Pozycje 51–51 z 51')).toBeDefined();
  });

  it('next button is disabled on the last page', () => {
    render(<Wrapper initialItems={createItems(51)} />);
    fireEvent.click(screen.getByRole('button', { name: /następna strona/i }));
    const nextBtn = screen.getByRole('button', { name: /następna strona/i }) as HTMLButtonElement;
    expect(nextBtn.disabled).toBe(true);
  });

  it('navigates back to first page via previous button', () => {
    render(<Wrapper initialItems={createItems(51)} />);
    fireEvent.click(screen.getByRole('button', { name: /następna strona/i }));
    fireEvent.click(screen.getByRole('button', { name: /poprzednia strona/i }));
    expect(screen.getByText('Pozycje 1–50 z 51')).toBeDefined();
  });

  it('renders last-page item names on page 2', () => {
    render(<Wrapper initialItems={createItems(51)} />);
    fireEvent.click(screen.getByRole('button', { name: /następna strona/i }));
    // Page 2 has only item 51 — its name input should be visible
    const nameInputs = screen.getAllByPlaceholderText('np. Kafelkowanie ściany');
    expect(nameInputs).toHaveLength(1);
  });
});
