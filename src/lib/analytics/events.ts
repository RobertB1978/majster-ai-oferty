/**
 * Central ANALYTICS_EVENTS dictionary.
 * Source of truth: docs/ULTRA_ENTERPRISE_ROADMAP.md §20.2
 *
 * Rules:
 * - Never use literal event strings in components — always reference this dictionary.
 * - To rename an event: add the new constant, deprecate the old one (do NOT delete).
 * - All 14 required events for Gate 0 are listed below.
 */
export const ANALYTICS_EVENTS = {
  LANDING_CTA_CLICK: "landing_cta_click",
  SIGNUP_STARTED: "signup_started",
  SIGNUP_COMPLETED: "signup_completed",
  ONBOARDING_STARTED: "onboarding_started",
  ONBOARDING_COMPLETED: "onboarding_completed",
  OFFER_QUICK_STARTED: "offer_quick_started",
  OFFER_FULL_STARTED: "offer_full_started",
  OFFER_QUICK_TO_FULL: "offer_quick_to_full",
  OFFER_PDF_GENERATED: "offer_pdf_generated",
  OFFER_SENT: "offer_sent",
  PUBLIC_OFFER_OPENED: "public_offer_opened",
  OFFER_ACCEPTED: "offer_accepted",
  OFFER_CHANGES_REQUESTED: "offer_changes_requested",
  FIRST_WEEK_RETURN: "first_week_return",
} as const;

/** Union type of all valid event name values. */
export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];
