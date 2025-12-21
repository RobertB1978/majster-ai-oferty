/**
 * ErrorBoundary Tests - C-02 CRITICAL FIX
 * Tests DEV/PROD error display separation and Sentry integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';
import * as sentryModule from '@/lib/sentry';

// Mock logError from sentry
vi.mock('@/lib/sentry', () => ({
  logError: vi.fn(),
}));

// Component that throws an error
function ThrowError({ message }: { message: string }) {
  throw new Error(message);
}

// Helper to suppress console.error during tests (ErrorBoundary logs errors)
function suppressConsoleError(callback: () => void) {
  const originalError = console.error;
  console.error = vi.fn();
  try {
    callback();
  } finally {
    console.error = originalError;
  }
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('DEV mode', () => {
    beforeEach(() => {
      // Mock DEV mode
      vi.stubEnv('MODE', 'development');
    });

    it('shows full error message and stack in DEV', () => {
      suppressConsoleError(() => {
        render(
          <ErrorBoundary>
            <ThrowError message="Test error in dev" />
          </ErrorBoundary>
        );
      });

      // Should show generic message
      expect(screen.getByText(/Coś poszło nie tak/i)).toBeDefined();
      expect(screen.getByText(/Wystąpił nieoczekiwany błąd/i)).toBeDefined();

      // Should show DEV details section
      expect(screen.getByText(/Szczegóły błędu \(DEV only\)/i)).toBeDefined();

      // Should show error message (in details)
      const details = screen.getByText(/Test error in dev/i);
      expect(details).toBeDefined();
    });

    it('does NOT show errorId in DEV mode', () => {
      suppressConsoleError(() => {
        render(
          <ErrorBoundary>
            <ThrowError message="Test error" />
          </ErrorBoundary>
        );
      });

      // Should NOT show error ID section (that's for PROD only)
      const errorIdText = screen.queryByText(/ID błędu:/i);
      expect(errorIdText).toBeNull();
    });
  });

  describe('PROD mode', () => {
    beforeEach(() => {
      // Mock PROD mode
      vi.stubEnv('MODE', 'production');
    });

    it('hides error details and shows only errorId in PROD', () => {
      suppressConsoleError(() => {
        render(
          <ErrorBoundary>
            <ThrowError message="Sensitive internal error" />
          </ErrorBoundary>
        );
      });

      // Should show generic message
      expect(screen.getByText(/Coś poszło nie tak/i)).toBeDefined();

      // Should NOT show error message (security!)
      const sensitiveText = screen.queryByText(/Sensitive internal error/i);
      expect(sensitiveText).toBeNull();

      // Should show error ID
      expect(screen.getByText(/ID błędu:/i)).toBeDefined();
      expect(screen.getByText(/ERR-/i)).toBeDefined(); // errorId format
    });

    it('does NOT show DEV details section in PROD', () => {
      suppressConsoleError(() => {
        render(
          <ErrorBoundary>
            <ThrowError message="Test error" />
          </ErrorBoundary>
        );
      });

      // Should NOT show DEV details
      const devDetails = screen.queryByText(/Szczegóły błędu \(DEV only\)/i);
      expect(devDetails).toBeNull();
    });
  });

  describe('Sentry integration', () => {
    it('calls logError with errorId and context', () => {
      const logErrorSpy = vi.spyOn(sentryModule, 'logError');

      suppressConsoleError(() => {
        render(
          <ErrorBoundary>
            <ThrowError message="Test error for sentry" />
          </ErrorBoundary>
        );
      });

      // Should call logError once
      expect(logErrorSpy).toHaveBeenCalledTimes(1);

      // Should pass error and context with errorId
      const [error, context] = logErrorSpy.mock.calls[0];
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error for sentry');
      expect(context).toBeDefined();
      expect(context?.errorId).toMatch(/^ERR-/); // errorId format
      expect(context?.boundary).toBe('RootErrorBoundary');
    });
  });

  describe('Error recovery', () => {
    it('renders children when no error', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <div>Normal content</div>
        </ErrorBoundary>
      );

      expect(getByText('Normal content')).toBeDefined();
    });

    it('supports custom fallback UI', () => {
      const customFallback = <div>Custom error UI</div>;

      suppressConsoleError(() => {
        render(
          <ErrorBoundary fallback={customFallback}>
            <ThrowError message="Test" />
          </ErrorBoundary>
        );
      });

      expect(screen.getByText('Custom error UI')).toBeDefined();
    });
  });

  describe('Error ID generation', () => {
    it('generates unique error IDs', () => {
      const errorIds = new Set<string>();

      // Render multiple error boundaries
      for (let i = 0; i < 5; i++) {
        suppressConsoleError(() => {
          const { container } = render(
            <ErrorBoundary>
              <ThrowError message={`Error ${i}`} />
            </ErrorBoundary>
          );

          // Extract errorId from rendered content
          const errorIdElement = container.querySelector('[class*="font-mono"]');
          if (errorIdElement?.textContent) {
            const match = errorIdElement.textContent.match(/ERR-[\d]+-[\w]+/);
            if (match) {
              errorIds.add(match[0]);
            }
          }
        });
      }

      // All errorIds should be unique
      expect(errorIds.size).toBe(5);
    });
  });
});
