/**
 * Public API for the analytics module.
 *
 * Usage:
 *   import { trackEvent, ANALYTICS_EVENTS } from "@/lib/analytics";
 *   trackEvent(ANALYTICS_EVENTS.OFFER_SENT, { offerId: "..." });
 */
export { ANALYTICS_EVENTS } from "./events";
export type { AnalyticsEventName } from "./events";
export { trackEvent, registerSink, clearSink } from "./track";
export type { AnalyticsSink } from "./track";
export type { AnalyticsPayload, ForbiddenPayloadKeys } from "./event-schema";
