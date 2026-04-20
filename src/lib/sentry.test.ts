/**
 * Tests for Sentry consent gate — PR-COMPLIANCE-01
 *
 * Covers:
 * - isAnalyticsConsented() correctly reads localStorage
 * - initSentry() does not load non-essential integrations without consent
 * - enableSentryWebVitals() is a safe no-op when Sentry is not configured
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock @sentry/react before importing the module under test
vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  browserTracingIntegration: vi.fn(() => ({ name: 'BrowserTracing' })),
  replayIntegration: vi.fn(() => ({ name: 'Replay' })),
  setUser: vi.fn(),
  setMeasurement: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  ErrorBoundary: vi.fn(),
}));

// Mock web-vitals
vi.mock('web-vitals', () => ({
  onCLS: vi.fn(),
  onINP: vi.fn(),
  onFCP: vi.fn(),
  onLCP: vi.fn(),
  onTTFB: vi.fn(),
}));

// Mock version
vi.mock('./version', () => ({
  APP_VERSION: '1.0.0',
}));

import * as Sentry from '@sentry/react';
import {
  isAnalyticsConsented,
  isSentryConfigured,
  enableSentryWebVitals,
  initSentry,
} from './sentry';

/** Helper: mock localStorage.getItem to return a consent object */
function mockConsent(analytics: boolean) {
  vi.spyOn(window.localStorage, 'getItem').mockImplementation((key: string) => {
    if (key === 'cookie_consent') {
      return JSON.stringify({ essential: true, analytics });
    }
    return null;
  });
}

/** Helper: mock localStorage.getItem to return no consent */
function mockNoConsent() {
  vi.spyOn(window.localStorage, 'getItem').mockReturnValue(null);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockNoConsent();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('isAnalyticsConsented()', () => {
  it('returns false when no consent record exists', () => {
    mockNoConsent();
    expect(isAnalyticsConsented()).toBe(false);
  });

  it('returns false when analytics is explicitly false', () => {
    mockConsent(false);
    expect(isAnalyticsConsented()).toBe(false);
  });

  it('returns true when analytics is true', () => {
    mockConsent(true);
    expect(isAnalyticsConsented()).toBe(true);
  });

  it('returns false when consent JSON is malformed', () => {
    vi.spyOn(window.localStorage, 'getItem').mockReturnValue('not-valid-json');
    expect(isAnalyticsConsented()).toBe(false);
  });

  it('returns false when analytics key is missing from consent', () => {
    vi.spyOn(window.localStorage, 'getItem').mockReturnValue(
      JSON.stringify({ essential: true })
    );
    expect(isAnalyticsConsented()).toBe(false);
  });
});

describe('initSentry() — consent gate', () => {
  const mockInit = vi.mocked(Sentry.init);
  const mockBrowserTracing = vi.mocked(Sentry.browserTracingIntegration);
  const mockReplay = vi.mocked(Sentry.replayIntegration);

  beforeEach(() => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123');
    vi.stubEnv('MODE', 'production');
    mockNoConsent();
  });

  it('does NOT include replayIntegration when analytics consent is absent', () => {
    initSentry();

    expect(mockInit).toHaveBeenCalledOnce();
    const options = mockInit.mock.calls[0][0] as Record<string, unknown>;
    const integrations = options.integrations as unknown[];
    expect(mockReplay).not.toHaveBeenCalled();
    expect(integrations).toHaveLength(0);
  });

  it('does NOT include browserTracingIntegration when analytics consent is absent', () => {
    initSentry();
    expect(mockBrowserTracing).not.toHaveBeenCalled();
  });

  it('sets replaysOnErrorSampleRate to 0.0 without consent', () => {
    initSentry();

    const options = mockInit.mock.calls[0][0] as Record<string, unknown>;
    expect(options.replaysOnErrorSampleRate).toBe(0.0);
  });

  it('sets tracesSampleRate to 0.0 without consent', () => {
    initSentry();

    const options = mockInit.mock.calls[0][0] as Record<string, unknown>;
    expect(options.tracesSampleRate).toBe(0.0);
  });

  it('includes replayIntegration when analytics consent is granted', () => {
    mockConsent(true);
    initSentry();

    expect(mockReplay).toHaveBeenCalledOnce();
    expect(mockBrowserTracing).toHaveBeenCalledOnce();
  });

  it('sets replaysOnErrorSampleRate to 1.0 in production with consent', () => {
    mockConsent(true);
    initSentry();

    const options = mockInit.mock.calls[0][0] as Record<string, unknown>;
    expect(options.replaysOnErrorSampleRate).toBe(1.0);
  });

  it('sets tracesSampleRate to 0.1 in production with consent', () => {
    mockConsent(true);
    initSentry();

    const options = mockInit.mock.calls[0][0] as Record<string, unknown>;
    expect(options.tracesSampleRate).toBe(0.1);
  });

  it('does not call Sentry.init when DSN is absent', () => {
    vi.stubEnv('VITE_SENTRY_DSN', '');
    initSentry();
    expect(mockInit).not.toHaveBeenCalled();
  });
});

describe('enableSentryWebVitals()', () => {
  it('does not throw when Sentry is not configured', () => {
    vi.stubEnv('VITE_SENTRY_DSN', '');
    expect(() => enableSentryWebVitals()).not.toThrow();
  });

  it('does not throw when Sentry is configured', () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123');
    expect(() => enableSentryWebVitals()).not.toThrow();
  });
});

describe('isSentryConfigured()', () => {
  it('returns false when DSN env var is empty', () => {
    vi.stubEnv('VITE_SENTRY_DSN', '');
    expect(isSentryConfigured()).toBe(false);
  });

  it('returns true when DSN env var is set', () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123');
    expect(isSentryConfigured()).toBe(true);
  });
});
