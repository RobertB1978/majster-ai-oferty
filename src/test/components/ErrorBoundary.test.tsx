/**
 * Tests for ErrorBoundary and PanelErrorBoundary.
 *
 * Verifies:
 *  - Children render normally when no error is thrown
 *  - ErrorBoundary shows fallback UI when a child throws
 *  - PanelErrorBoundary renders null (or custom fallback) instead of crashing
 *  - Retry button resets the error state so children can render again
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary, PanelErrorBoundary } from '@/components/ErrorBoundary';

/* ── Stubs ─────────────────────────────────────────────────────── */

vi.mock('@/lib/sentry', () => ({ logError: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
vi.mock('@/lib/errors/formatError', () => ({
  formatError: (_err: unknown) => ({
    code: 'MAJ-TEST-001',
    requestId: 'req-test',
    fingerprint: 'fp-test',
    userMessage: 'Test error message',
    retryable: true,
    ownerActionRequired: false,
    problem: { type: 'unknown' },
  }),
}));

// i18n returns the key as-is so error UI text is predictable
vi.mock('@/i18n', () => ({
  default: { t: (key: string) => key },
}));

/* ── Helper: component that throws ─────────────────────────────── */

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Boom');
  return <span>OK</span>;
}

/* ── Suppress React's console.error for caught errors in tests ── */
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

/* ── Tests ─────────────────────────────────────────────────────── */

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('OK')).toBeDefined();
  });

  it('shows the error fallback when a child throws', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    // The boundary renders i18n key text
    expect(screen.getByText('errors.somethingWentWrong')).toBeDefined();
    expect(screen.getByText('MAJ-TEST-001')).toBeDefined();
  });

  it('resets error state when Retry button is clicked', () => {
    let shouldThrow = true;

    const { rerender } = render(
      <ErrorBoundary>
        <Bomb shouldThrow={shouldThrow} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('errors.somethingWentWrong')).toBeDefined();

    // Stop throwing, then hit Retry
    shouldThrow = false;
    fireEvent.click(screen.getByText('common.retry'));

    // Retry resets state — re-render with non-throwing Bomb
    rerender(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('OK')).toBeDefined();
  });

  it('renders a custom fallback prop when provided', () => {
    render(
      <ErrorBoundary fallback={<span>Custom fallback</span>}>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Custom fallback')).toBeDefined();
  });
});

describe('PanelErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <PanelErrorBoundary>
        <Bomb shouldThrow={false} />
      </PanelErrorBoundary>,
    );
    expect(screen.getByText('OK')).toBeDefined();
  });

  it('renders null when a child throws and no fallback provided', () => {
    const { container } = render(
      <PanelErrorBoundary>
        <Bomb shouldThrow />
      </PanelErrorBoundary>,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders custom fallback when a child throws', () => {
    render(
      <PanelErrorBoundary fallback={<span>Panel fallback</span>}>
        <Bomb shouldThrow />
      </PanelErrorBoundary>,
    );
    expect(screen.getByText('Panel fallback')).toBeDefined();
  });
});
