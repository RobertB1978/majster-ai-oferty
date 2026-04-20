import * as Sentry from "@sentry/react";
import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';
import { APP_VERSION } from './version';

/**
 * Check if Sentry is properly configured
 * Security Pack Δ1 - PROMPT 2/10
 */
export function isSentryConfigured(): boolean {
  return !!import.meta.env.VITE_SENTRY_DSN;
}

/**
 * Reads analytics consent from localStorage.
 * Returns true only when the user has explicitly granted analytics consent.
 * Used to gate non-essential Sentry telemetry (replay, tracing, web vitals).
 * ePrivacy Art. 5(3) / GDPR Art. 7 compliance gate.
 */
export function isAnalyticsConsented(): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    const raw = localStorage.getItem('cookie_consent');
    if (!raw) return false;
    const consent = JSON.parse(raw) as { analytics?: boolean };
    return consent.analytics === true;
  } catch {
    return false;
  }
}

/**
 * Enables non-essential Sentry features (web vitals) after analytics consent is granted
 * during the current session. Call this immediately after saving analytics consent.
 *
 * Session Replay and browser tracing integrations are only active when consent existed
 * at Sentry init time (i.e., on page load). They will be fully active on next page load.
 */
export function enableSentryWebVitals(): void {
  if (!isSentryConfigured()) return;
  initWebVitals();
}

/**
 * Self-check for Sentry configuration
 * Warns if monitoring is not configured in production
 */
function sentryConfigSelfCheck() {
  const environment = import.meta.env.MODE;
  const isConfigured = isSentryConfigured();

  if (environment === 'production' && !isConfigured) {
    console.warn(
      '⚠️ SENTRY NOT CONFIGURED IN PRODUCTION\n' +
      '   Monitoring and error tracking is disabled.\n' +
      '   Set VITE_SENTRY_DSN in Vercel environment variables.\n' +
      '   See: /docs/SENTRY_SETUP.md'
    );
  } else if (environment === 'development' && !isConfigured) {
    console.info('ℹ️ Sentry not configured (dev mode - this is OK)');
  }
}

/**
 * Inicjalizacja Sentry dla monitoringu błędów i wydajności.
 * Sentry będzie aktywne tylko jeśli DSN jest ustawiony.
 *
 * Zgodność z ePrivacy Art. 5(3) / GDPR Art. 7:
 * - Podstawowy monitoring błędów (bez replay) uruchamia się zawsze gdy DSN jest dostępny.
 * - Session Replay, browser tracing i web vitals — tylko przy zgodzie na analytics.
 * - enableSentryWebVitals() aktywuje web vitals jeśli zgoda zostanie udzielona w trakcie sesji.
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.MODE;

  // Run self-check first
  sentryConfigSelfCheck();

  if (!dsn) {
    if (import.meta.env.DEV) {
      console.log('Sentry not configured (missing VITE_SENTRY_DSN)');
    }
    return;
  }

  // Check analytics consent BEFORE initializing non-essential integrations.
  // Session Replay and performance tracing are non-essential under ePrivacy Art. 5(3).
  const analyticsConsented = isAnalyticsConsented();

  Sentry.init({
    dsn,
    environment,
    release: `majster-ai@${APP_VERSION}`,

    integrations: [
      // Non-essential integrations: only include when analytics consent exists.
      // Without consent, basic error capture still works (no PII beyond IP/UA in error events).
      ...(analyticsConsented ? [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ] : []),
    ],

    // Performance tracing: non-essential — only with consent
    tracesSampleRate: analyticsConsented
      ? (environment === "production" ? 0.1 : 1.0)
      : 0.0,

    // Session Replay: non-essential
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: analyticsConsented
      ? (environment === "production" ? 1.0 : 0.0)
      : 0.0,

    // Filtruj wrażliwe dane
    beforeSend(event) {
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
          if (breadcrumb.data) {
            delete breadcrumb.data.email;
            delete breadcrumb.data.password;
            delete breadcrumb.data.token;
            delete breadcrumb.data.apiKey;
          }
          return breadcrumb;
        });
      }

      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
      }

      return event;
    },

    ignoreErrors: [
      'Non-Error promise rejection captured',
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Extension context invalidated',
      'chrome-extension://',
      'moz-extension://',
      'Failed to fetch',
      'NetworkError',
      'Network request failed',
      'AbortError',
    ],
  });

  // Web Vitals: non-essential — only with analytics consent
  if (analyticsConsented) {
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => initWebVitals(), { timeout: 2000 });
    } else {
      setTimeout(initWebVitals, 100);
    }
  }

  if (import.meta.env.DEV) {
    console.log(`Sentry initialized (${environment}, analytics consent: ${analyticsConsented})`);
  }
}

/**
 * Web Vitals monitoring - wysyła metryki wydajności do Sentry
 * Metryki: CLS, INP, FCP, LCP, TTFB
 */
function initWebVitals() {
  try {
    const sendToSentry = (metric: Metric) => {
      try {
        // Wysyłaj tylko w produkcji aby nie zaśmiecać danych dev
        if (import.meta.env.MODE === 'production') {
          Sentry.setMeasurement(metric.name, metric.value, metric.unit);
        }

        // Log do konsoli w dev mode
        if (import.meta.env.MODE === 'development') {
          console.log(`[Web Vitals] ${metric.name}:`, metric.value, metric.unit);
        }
      } catch (error) {
        console.warn(`Failed to report web vital ${metric.name}:`, error);
      }
    };

    // Core Web Vitals (Google)
    onCLS(sendToSentry); // Cumulative Layout Shift - stabilność wizualna
    onINP(sendToSentry); // Interaction to Next Paint - interaktywność (zastępuje przestarzały FID)
    onLCP(sendToSentry); // Largest Contentful Paint - szybkość ładowania

    // Dodatkowe metryki
    onFCP(sendToSentry); // First Contentful Paint - pierwsze renderowanie
    onTTFB(sendToSentry); // Time to First Byte - szybkość odpowiedzi serwera
  } catch (error) {
    console.warn('Failed to initialize Web Vitals monitoring:', error);
  }
}

/**
 * Helper do logowania błędów do Sentry
 */
export function logError(error: Error, context?: Record<string, unknown>) {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  } else {
    console.error('Error:', error, context);
  }
}

/**
 * Helper do logowania custom eventów do Sentry
 */
export function logEvent(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, unknown>) {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureMessage(message, {
      level,
      extra: context,
    });
  } else if (import.meta.env.DEV) {
    console.log(`[${level}] ${message}`, context);
  }
}

/**
 * Ustaw user context dla Sentry (po zalogowaniu)
 */
export function setSentryUser(userId: string, email?: string) {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.setUser({
      id: userId,
      email: email || undefined,
    });
  }
}

/**
 * Wyczyść user context (po wylogowaniu)
 */
export function clearSentryUser() {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.setUser(null);
  }
}

/**
 * Error Boundary Component - opakowuje część aplikacji aby łapać błędy React
 * Używaj: <SentryErrorBoundary><YourComponent /></SentryErrorBoundary>
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;
