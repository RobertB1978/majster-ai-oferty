/**
 * Plausible Analytics sink for Majster.AI.
 * Source of truth: docs/ULTRA_ENTERPRISE_ROADMAP.md §23.2
 *
 * Integration strategy:
 * - Plausible script is loaded via index.html (data-domain="majsterai.com")
 * - This module wraps window.plausible() so the rest of the app stays provider-agnostic
 * - No npm package needed — Plausible exposes a tiny global function
 * - RODO/GDPR compliant — no cookies, no fingerprinting, EU-hosted
 *
 * To activate in production: add to index.html (already done by this PR):
 *   <script defer data-domain="majsterai.com" src="https://plausible.io/js/script.js"></script>
 */
import type { AnalyticsSink } from "./track";
import type { AnalyticsEventName } from "./events";
import type { AnalyticsPayload } from "./event-schema";

/** Plausible global injected by their script tag. */
declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props?: Record<string, string | number | boolean> },
    ) => void;
  }
}

/**
 * Convert an AnalyticsPayload to Plausible-safe props.
 * Only string/number/boolean primitives allowed — no PII, no nested objects.
 */
function toPlausibleProps(
  payload?: AnalyticsPayload,
): Record<string, string | number | boolean> | undefined {
  if (!payload) return undefined;

  const props: Record<string, string | number | boolean> = {};

  if (payload.source) props.source = payload.source;
  if (payload.mode) props.mode = payload.mode;
  if (payload.screen) props.screen = payload.screen;
  // UUIDs are safe — they are not PII
  if (payload.offerId) props.offer_id = payload.offerId;
  if (payload.draftId) props.draft_id = payload.draftId;
  // Spread safe meta fields
  if (payload.meta) {
    for (const [k, v] of Object.entries(payload.meta)) {
      props[k] = v;
    }
  }

  return Object.keys(props).length > 0 ? props : undefined;
}

/**
 * Plausible Analytics sink.
 * Silently no-ops if Plausible script is not loaded (dev / localhost).
 */
export const plausibleSink: AnalyticsSink = {
  send(event: AnalyticsEventName, payload?: AnalyticsPayload): void {
    if (typeof window === "undefined" || typeof window.plausible !== "function") {
      return;
    }

    const props = toPlausibleProps(payload);
    window.plausible(event, props ? { props } : undefined);
  },
};
