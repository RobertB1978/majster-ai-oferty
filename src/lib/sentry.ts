import * as Sentry from "@sentry/react";
import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';

/**
 * Check if Sentry is properly configured
 * Security Pack Δ1 - PROMPT 2/10
 */
export function isSentryConfigured(): boolean {
  return !!import.meta.env.VITE_SENTRY_DSN;
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
 * Inicjalizacja Sentry dla monitoringu błędów i wydajności
 * Sentry będzie aktywne tylko w produkcji (gdy VITE_SENTRY_DSN jest ustawione)
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.MODE;

  // Run self-check first
  sentryConfigSelfCheck();

  // Inicjalizuj Sentry tylko jeśli DSN jest ustawiony
  if (dsn) {
    Sentry.init({
      dsn,
      environment,

      // Performance Monitoring
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          // Session Replay dla debugowania - tylko błędy w produkcji
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],

      // Performance monitoring - sample rate 10% w produkcji, 100% w dev
      tracesSampleRate: environment === "production" ? 0.1 : 1.0,

      // Session Replay - tylko sesje z błędami
      replaysSessionSampleRate: 0.0, // Nie nagrywaj zwykłych sesji
      replaysOnErrorSampleRate: environment === "production" ? 1.0 : 0.0, // Zawsze nagrywaj sesje z błędami

      // Filtruj wrażliwe dane
      beforeSend(event) {
        // Usuń wrażliwe dane z breadcrumbs
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
            if (breadcrumb.data) {
              // Usuń potencjalnie wrażliwe dane
              delete breadcrumb.data.email;
              delete breadcrumb.data.password;
              delete breadcrumb.data.token;
              delete breadcrumb.data.apiKey;
            }
            return breadcrumb;
          });
        }

        // Usuń wrażliwe dane z contextu
        if (event.request?.headers) {
          delete event.request.headers['Authorization'];
          delete event.request.headers['Cookie'];
        }

        return event;
      },

      // Ignoruj znane błędy, które nie wymagają akcji
      ignoreErrors: [
        // Błędy przeglądarki
        'Non-Error promise rejection captured',
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',

        // Błędy rozszerzeń
        'Extension context invalidated',
        'chrome-extension://',
        'moz-extension://',

        // Błędy sieciowe (transient errors)
        'Failed to fetch',
        'NetworkError',
        'Network request failed',

        // Aborted requests - normalne zachowanie
        'AbortError',
      ],
    });

    // Inicjalizuj Web Vitals monitoring ASYNCHRONOUSLY during idle time
    // This prevents blocking the main thread during startup
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => {
        initWebVitals();
      }, { timeout: 2000 });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(initWebVitals, 100);
    }

    console.log(`✅ Sentry zainicjalizowane (${environment})`);
  } else {
    console.log('ℹ️ Sentry nie jest skonfigurowane (brak VITE_SENTRY_DSN)');
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
 * @param error - Error object to log
 * @param context - Additional context (errorId will be extracted as tag)
 */
export function logError(error: Error, context?: Record<string, unknown>) {
  if (import.meta.env.VITE_SENTRY_DSN) {
    // Extract errorId from context to use as tag for easier filtering
    const errorId = context?.errorId as string | undefined;
    const restContext = { ...context };
    delete restContext.errorId;

    Sentry.captureException(error, {
      tags: errorId ? { errorId } : undefined,
      extra: restContext
    });
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
  } else {
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
