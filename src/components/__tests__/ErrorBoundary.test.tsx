import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';
import { ErrorBoundary } from '../ErrorBoundary';

const Thrower = () => {
  throw new Error('sensitive internal message');
};

describe('ErrorBoundary', () => {
  it('renders generic message in production-like mode without leaking error text', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>
    );

    expect(screen.getByText(/coś poszło nie tak/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/error message/i)).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('exposes error details only in development', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <ErrorBoundary showDetails>
        <Thrower />
      </ErrorBoundary>
    );

    expect(screen.getByText(/szczegóły \(tryb deweloperski\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/error message/i)).toHaveTextContent('sensitive internal message');

    consoleSpy.mockRestore();
  });
});
