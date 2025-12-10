import * as Sentry from "@sentry/react";

/**
 * Inicjalizacja Sentry dla monitoringu błędów i wydajności
 * Sentry będzie aktywne tylko w produkcji (gdy VITE_SENTRY_DSN jest ustawione)
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.MODE;

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

        // Błędy sieciowe
        'Failed to fetch',
        'NetworkError',
        'Network request failed',

        // Aborted requests - normalne zachowanie
        'AbortError',
      ],
    });

    console.log(`✅ Sentry zainicjalizowane (${environment})`);
  } else {
    console.log('ℹ️ Sentry nie jest skonfigurowane (brak VITE_SENTRY_DSN)');
  }
}

/**
 * Helper do logowania błędów do Sentry
 */
export function logError(error: Error, context?: Record<string, any>) {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  } else {
    console.error('Error:', error, context);
  }
}

/**
 * Helper do logowania custom eventów do Sentry
 */
export function logEvent(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>) {
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
