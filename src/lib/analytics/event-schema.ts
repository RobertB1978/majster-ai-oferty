/**
 * Analytics event payload types.
 * Source of truth: docs/ULTRA_ENTERPRISE_ROADMAP.md §20.3
 *
 * NEVER include PII or sensitive business data in payloads:
 * - No phone numbers
 * - No email addresses
 * - No physical addresses
 * - No notes / free-text content
 * - No photos / file URLs
 * - No raw offer amounts / financial figures
 */

/** Allowed payload fields — all optional, no PII. */
export interface AnalyticsPayload {
  /** Supabase user UUID (not email). */
  userId?: string;
  /** Draft UUID. */
  draftId?: string;
  /** Offer UUID. */
  offerId?: string;
  /** Client UUID (not name/email). */
  clientId?: string;
  /** UI entry-point that triggered the event (e.g. "navbar", "dashboard_card"). */
  source?: string;
  /** Offer creation mode. */
  mode?: "quick" | "full";
  /** Current screen / route path. */
  screen?: string;
  /** Arbitrary safe metadata — must NOT contain PII. */
  meta?: Record<string, string | number | boolean>;
}

/**
 * Compile-time guard: keys that must NEVER appear in an analytics payload.
 * This type is used only for documentation and static-analysis awareness.
 */
export type ForbiddenPayloadKeys =
  | "phone"
  | "email"
  | "address"
  | "notes"
  | "photos"
  | "amount"
  | "price"
  | "cost"
  | "total";
