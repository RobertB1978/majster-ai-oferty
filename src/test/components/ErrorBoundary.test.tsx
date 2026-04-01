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
import React from 'react';
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

// i18n zwraca klucz jako tekst — fallback ErrorBoundary jest przewidywalny
vi.mock('@/i18n', () => ({
  default: { t: (key: string) => key },
}));

/* ── Helper: komponent rzucający błąd ──────────────────────────── */

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Boom');
  return <span>OK</span>;
}

/**
 * BombRef używa ref zamiast props — zmiana ref nie wywołuje ponownego
 * renderowania, ale wartość jest widoczna przy następnym renderowaniu
 * wyzwolonym przez Retry. Konieczne do poprawnego testu Retry.
 */
function makeBombRef() {
  const ref = { current: true };
  function BombRef() {
    if (ref.current) throw new Error('Boom');
    return <span>OK</span>;
  }
  return { ref, BombRef };
}

/* ── Suppress React's console.error for expected caught errors ── */
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
    expect(screen.getByText('errors.somethingWentWrong')).toBeDefined();
    // Kod błędu jest częścią dłuższego tekstu "errors.standard.domainCode: MAJ-TEST-001"
    expect(screen.getByText(/MAJ-TEST-001/)).toBeDefined();
  });

  it('resets error state when Retry button is clicked', () => {
    // Używamy ref żeby zatrzymać rzucanie błędu zanim Retry wyzwoli re-render.
    // Zwykła prop nie zadziała bo ErrorBoundary re-renderuje stare dzieci
    // (te które rzucają) zanim dostanie nowe z rerender().
    const { ref, BombRef } = makeBombRef();

    render(
      <ErrorBoundary>
        <BombRef />
      </ErrorBoundary>,
    );

    expect(screen.getByText('errors.somethingWentWrong')).toBeDefined();

    // Wyłącz rzucanie przed kliknięciem — następny render (wyzwolony przez Retry)
    // dostanie component bez błędu.
    ref.current = false;
    fireEvent.click(screen.getByText('common.retry'));

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
