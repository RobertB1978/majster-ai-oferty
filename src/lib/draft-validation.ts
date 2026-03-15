/**
 * OfferDraft validation helpers.
 *
 * SOURCE OF TRUTH: docs/ULTRA_ENTERPRISE_ROADMAP.md — Section 19
 *
 * Functions:
 *   isReadyForTransition() — 4 binary conditions from section 19.3
 *   isReadyForPDF()        — 5 conditions from section 19.5
 *   isDraftValid()         — Quick Mode minimum validity (section 19.2)
 */

import type { OfferDraft, DraftLineItem } from '@/types/offer-draft';
import type {
  TransitionCheckResult,
  TransitionCondition,
  PdfReadinessResult,
  PdfReadinessCondition,
} from '@/types/offer-draft-helpers';

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Collects all line items from both flat list and variants. */
function collectAllLineItems(draft: OfferDraft): DraftLineItem[] {
  if (draft.pricing.variants && draft.pricing.variants.length > 0) {
    return draft.pricing.variants.flatMap((v) => v.lineItems);
  }
  return draft.pricing.lineItems;
}

/** Returns true when the client block satisfies the Quick Mode identification rule. */
function clientIsIdentified(draft: OfferDraft): boolean {
  const { client } = draft;

  // Option A: linked to an existing client record
  if (client.id && client.id.trim().length > 0) {
    return true;
  }

  // Option B: temporary name + at least one contact method
  const hasTempName = typeof client.tempName === 'string' && client.tempName.trim().length > 0;
  const hasTempPhone = typeof client.tempPhone === 'string' && client.tempPhone.trim().length > 0;
  const hasTempEmail = typeof client.tempEmail === 'string' && client.tempEmail.trim().length > 0;

  return hasTempName && (hasTempPhone || hasTempEmail);
}

/** Returns true when at least one field capture context source is present. */
function hasMinContextSource(draft: OfferDraft): boolean {
  const { fieldCapture, checklist } = draft;

  const hasPhoto = fieldCapture.photos.length > 0;
  const hasNote = typeof fieldCapture.textNote === 'string' && fieldCapture.textNote.trim().length > 0;

  // Any checklist field consciously answered (not 'unknown') counts as context
  const checklistAnswered =
    checklist.hasDocumentation !== 'unknown' ||
    checklist.hasInvestorEstimate !== 'unknown' ||
    (typeof checklist.clientRequirements === 'string' && checklist.clientRequirements.trim().length > 0) ||
    (typeof checklist.siteConstraints === 'string' && checklist.siteConstraints.trim().length > 0);

  return hasPhoto || hasNote || checklistAnswered;
}

// ── isReadyForTransition ──────────────────────────────────────────────────────

/**
 * Evaluates the 4 binary conditions required for Quick → Full transition.
 * Section 19.3 of docs/ULTRA_ENTERPRISE_ROADMAP.md.
 *
 * Conditions:
 *   1. draft_id exists           — id is a non-empty string
 *   2. ownerUserId assigned      — ownerUserId is a non-empty string
 *   3. Client identified         — id OR (tempName + (tempPhone | tempEmail))
 *   4. Min context source        — photo OR textNote OR any checklist answer
 */
export function isReadyForTransition(draft: OfferDraft): TransitionCheckResult {
  const failed: TransitionCondition[] = [];

  // Condition 1: draft_id exists
  if (!draft.id || draft.id.trim().length === 0) {
    failed.push('draft_id_exists');
  }

  // Condition 2: ownerUserId assigned
  if (!draft.ownerUserId || draft.ownerUserId.trim().length === 0) {
    failed.push('owner_user_id_assigned');
  }

  // Condition 3: client identified
  if (!clientIsIdentified(draft)) {
    failed.push('client_identified');
  }

  // Condition 4: min one context source present
  if (!hasMinContextSource(draft)) {
    failed.push('min_context_source_present');
  }

  return { ok: failed.length === 0, failedConditions: failed };
}

// ── isReadyForPDF ─────────────────────────────────────────────────────────────

/**
 * Evaluates the 5 PDF readiness conditions.
 * Section 19.5 of docs/ULTRA_ENTERPRISE_ROADMAP.md.
 *
 * Conditions:
 *   1. Client has name + phone or email
 *   2. Min 1 line item (across flat list or variants)
 *   3. Every line item has name + qty + unit + price
 *   4. VAT configured (each item has vatRate ≥ 0) OR pricing.isVatExempt === true
 *   5. pricing.pricingState === 'completed'
 */
export function isReadyForPDF(draft: OfferDraft): PdfReadinessResult {
  const failed: PdfReadinessCondition[] = [];

  // Condition 1: client has name + at least one contact
  const clientName = draft.client.id ??
    (typeof draft.client.tempName === 'string' ? draft.client.tempName.trim() : '');
  const clientHasName = typeof clientName === 'string'
    ? clientName.length > 0
    : Boolean(clientName);
  const clientHasContact =
    (typeof draft.client.tempPhone === 'string' && draft.client.tempPhone.trim().length > 0) ||
    (typeof draft.client.tempEmail === 'string' && draft.client.tempEmail.trim().length > 0) ||
    // Existing client linked by id is assumed to have contact on file
    (typeof draft.client.id === 'string' && draft.client.id.trim().length > 0);

  if (!clientHasName || !clientHasContact) {
    failed.push('client_has_name_and_contact');
  }

  // Condition 2: min 1 line item
  const allItems = collectAllLineItems(draft);
  if (allItems.length === 0) {
    failed.push('min_one_line_item');
  }

  // Condition 3: every line item is complete
  const allItemsComplete = allItems.every(
    (item) =>
      item.name.trim().length > 0 &&
      item.qty > 0 &&
      item.unit.trim().length > 0 &&
      item.unitPriceNet >= 0,
  );
  if (allItems.length > 0 && !allItemsComplete) {
    failed.push('all_line_items_complete');
  }

  // Condition 4: VAT configured or consciously exempt
  const vatConfigured =
    draft.pricing.isVatExempt ||
    allItems.every((item) => item.vatRate >= 0);
  if (!vatConfigured) {
    failed.push('vat_configured');
  }

  // Condition 5: pricing state completed
  if (draft.pricing.pricingState !== 'completed') {
    failed.push('pricing_state_completed');
  }

  return { ok: failed.length === 0, failedConditions: failed };
}

// ── isDraftValid ──────────────────────────────────────────────────────────────

/**
 * Validates the Quick Mode minimum requirements.
 * Section 19.2 of docs/ULTRA_ENTERPRISE_ROADMAP.md.
 *
 * Minimum for a valid draft:
 *   - id is present
 *   - mode is set
 *   - ownerUserId is present
 *   - client: existing id OR tempName + tempPhone
 *   - fieldCapture: at least one of photo, textNote, or checklist
 *   - pricing.pricingState is set (defaults to 'not_started' in Quick Mode)
 */
export function isDraftValid(draft: OfferDraft): boolean {
  if (!draft.id || draft.id.trim().length === 0) return false;
  if (!draft.mode) return false;
  if (!draft.ownerUserId || draft.ownerUserId.trim().length === 0) return false;
  if (!clientIsIdentified(draft)) return false;
  if (!hasMinContextSource(draft)) return false;
  if (!draft.pricing.pricingState) return false;

  return true;
}
