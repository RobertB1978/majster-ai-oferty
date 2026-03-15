/**
 * OfferDraft helper types.
 *
 * Result types and discriminated unions used by the validation functions
 * in src/lib/draft-validation.ts.
 */

import type { DraftMode } from './offer-draft';

// ── Transition readiness ──────────────────────────────────────────────────────

/**
 * Identifiers for the 4 binary conditions from section 19.3.
 * Used in TransitionCheckResult to communicate which conditions failed.
 */
export type TransitionCondition =
  | 'draft_id_exists'
  | 'owner_user_id_assigned'
  | 'client_identified'
  | 'min_context_source_present';

/** Result of isReadyForTransition() check. */
export interface TransitionCheckResult {
  ok: boolean;
  /** Conditions that evaluated to false. Empty when ok === true. */
  failedConditions: TransitionCondition[];
}

// ── PDF readiness ─────────────────────────────────────────────────────────────

/**
 * Identifiers for the 5 PDF readiness conditions from section 19.5.
 */
export type PdfReadinessCondition =
  | 'client_has_name_and_contact'
  | 'min_one_line_item'
  | 'all_line_items_complete'
  | 'vat_configured'
  | 'pricing_state_completed';

/** Result of isReadyForPDF() check. */
export interface PdfReadinessResult {
  ok: boolean;
  /** Conditions that evaluated to false. Empty when ok === true. */
  failedConditions: PdfReadinessCondition[];
}

// ── Mode transition guard ─────────────────────────────────────────────────────

/**
 * Returns true if transitioning from `from` to `to` is a valid one-way
 * quick → full progression (section 19.4 Expansion Rule).
 *
 * Valid: quick → full
 * Invalid: full → quick, same → same
 */
export function isValidModeTransition(from: DraftMode, to: DraftMode): boolean {
  return from === 'quick' && to === 'full';
}
