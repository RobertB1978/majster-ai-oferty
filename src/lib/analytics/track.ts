/**
 * Provider-agnostic event tracking helper.
 * Source of truth: docs/ULTRA_ENTERPRISE_ROADMAP.md §20.4
 *
 * Guarantees:
 * - Never throws into UI code.
 * - Silent failure in production.
 * - console.debug logging in development.
 * - Asynchronous — does not block rendering.
 */
import type { AnalyticsEventName } from "./events";
import type { AnalyticsPayload } from "./event-schema";
import { logger } from '@/lib/logger';

/** Sink interface that concrete providers will implement later. */
export interface AnalyticsSink {
  send(event: AnalyticsEventName, payload?: AnalyticsPayload): void | Promise<void>;
}

/** Currently registered sink. `null` = no provider wired yet. */
let currentSink: AnalyticsSink | null = null;

/**
 * Register an analytics provider sink.
 * Call once during app bootstrap when a provider is ready.
 */
export function registerSink(sink: AnalyticsSink): void {
  currentSink = sink;
}

/**
 * Remove the current sink (useful for tests or teardown).
 */
export function clearSink(): void {
  currentSink = null;
}

const isDev = import.meta.env?.DEV === true;

/**
 * Track an analytics event.
 *
 * - Components and hooks should call ONLY this function.
 * - Uses `ANALYTICS_EVENTS.*` constants — no literal strings.
 * - Wraps everything in try/catch so a tracking failure never crashes UI.
 */
export function trackEvent(
  event: AnalyticsEventName,
  payload?: AnalyticsPayload,
): void {
  try {
    if (isDev) {
      logger.debug("[analytics]", event, payload ?? {});
    }

    if (currentSink) {
      // Fire-and-forget — never await in the caller's synchronous path.
      void Promise.resolve(currentSink.send(event, payload)).catch(() => {
        // Intentionally swallowed — tracking must never affect UX.
      });
    }
  } catch {
    // Intentionally swallowed — tracking must never throw into UI.
  }
}
