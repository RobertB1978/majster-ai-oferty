/**
 * useDraft — Gate 1 Condition 2: stable draft_id, zero data loss on Quick→Full.
 *
 * SOURCE OF TRUTH: docs/ULTRA_ENTERPRISE_ROADMAP.md §19, §19.3, §19.4, §20
 *
 * Contract:
 * - draft.id is generated once on mount and NEVER reassigned (§19.4 Expansion Rule).
 * - mode can only progress quick → full; reverse is forbidden (§19.4).
 * - All Quick Mode data is preserved verbatim when expanding to Full Mode.
 * - sourceContext.createdFrom stays 'quick-mode' even after transition (§19.4).
 * - OFFER_QUICK_TO_FULL fires after a successful transition only (§20).
 * - Every field-group update is persisted via the offline queue (§25.1).
 */

import { useState, useCallback, useMemo } from 'react';
import type {
  OfferDraft,
  OfferDraftClient,
  OfferDraftFieldCapture,
  OfferDraftChecklist,
  OfferDraftPricing,
  DraftDeviceType,
} from '@/types/offer-draft';
import type { TransitionCondition } from '@/types/offer-draft-helpers';
import { isValidModeTransition } from '@/types/offer-draft-helpers';
import { isReadyForTransition } from '@/lib/draft-validation';
import { addEntry } from '@/lib/offline-queue';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';
import { trackEvent } from '@/lib/analytics/track';

// ── Internal helpers ──────────────────────────────────────────────────────────

function generateDraftId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for environments without randomUUID (e.g. older jsdom)
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function detectDeviceType(): DraftDeviceType {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

function createInitialDraft(ownerUserId: string): OfferDraft {
  return {
    id: generateDraftId(),
    mode: 'quick',
    status: 'draft',
    ownerUserId,
    client: {
      id: null,
      tempName: null,
      tempPhone: null,
      tempEmail: null,
    },
    sourceContext: {
      createdFrom: 'quick-mode',
      deviceType: detectDeviceType(),
      startedAt: new Date().toISOString(),
    },
    fieldCapture: {
      photos: [],
      textNote: null,
      voiceNotePath: null,
      measurements: [],
    },
    checklist: {
      hasDocumentation: 'unknown',
      hasInvestorEstimate: 'unknown',
      clientRequirements: null,
      siteConstraints: null,
    },
    pricing: {
      lineItems: [],
      variants: null,
      currency: 'PLN',
      pricingState: 'not_started',
      isVatExempt: false,
    },
    output: {
      pdfState: 'not_ready',
      publicLinkState: 'not_ready',
    },
  };
}

// ── Public interface ──────────────────────────────────────────────────────────

/** The public API surface returned by useDraft(). */
export interface DraftEngine {
  /** Current draft state. `draft.id` is stable and never reassigned. */
  draft: OfferDraft;

  /**
   * True when all 4 transition conditions from §19.3 are satisfied:
   *   1. draft_id exists
   *   2. ownerUserId assigned
   *   3. client identified (id OR tempName + tempPhone/tempEmail)
   *   4. min one context source (photo OR note OR checklist)
   */
  canTransitionToFull: boolean;

  /** Conditions from §19.3 that are not yet met. Empty when canTransitionToFull is true. */
  missingTransitionFields: TransitionCondition[];

  /** Merge-update the client block. Schedules an offline queue save. */
  updateClient: (patch: Partial<OfferDraftClient>) => void;

  /** Merge-update the fieldCapture block. Schedules an offline queue save. */
  updateFieldCapture: (patch: Partial<OfferDraftFieldCapture>) => void;

  /** Merge-update the checklist block. Schedules an offline queue save. */
  updateChecklist: (patch: Partial<OfferDraftChecklist>) => void;

  /** Merge-update the pricing block. Schedules an offline queue save. */
  updatePricing: (patch: Partial<OfferDraftPricing>) => void;

  /**
   * Attempt Quick → Full transition (§19.4 Expansion Rule).
   *
   * Returns `true` on success, `false` when canTransitionToFull is false
   * or the current mode is already 'full'.
   *
   * On success:
   * - mode becomes 'full'
   * - All existing data is preserved verbatim
   * - sourceContext.createdFrom remains 'quick-mode'
   * - draft_id is unchanged
   * - OFFER_QUICK_TO_FULL analytics event fires
   * - Updated draft is persisted via offline queue
   */
  transitionToFull: () => boolean;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useDraft — central draft state engine for Gate 1 Condition 2.
 *
 * @param ownerUserId - Authenticated user id, assigned as ownerUserId on creation.
 */
export function useDraft(ownerUserId: string): DraftEngine {
  // draft_id is stable: created once via lazy initializer, never replaced.
  const [draft, setDraft] = useState<OfferDraft>(() => createInitialDraft(ownerUserId));

  // ── Offline persistence helper ──────────────────────────────────────────────

  const scheduleSave = useCallback((updated: OfferDraft): void => {
    // Fire-and-forget: offline persistence must never block UI updates.
    void addEntry('OFFER_DRAFT_SAVE', {
      draftId: updated.id,
      draft: updated,
    }).catch(() => {
      // Intentionally swallowed: queue may be unavailable (offline, test env).
    });
  }, []);

  // ── Field-group updaters ────────────────────────────────────────────────────

  const updateClient = useCallback(
    (patch: Partial<OfferDraftClient>): void => {
      setDraft((prev) => {
        const next: OfferDraft = { ...prev, client: { ...prev.client, ...patch } };
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  const updateFieldCapture = useCallback(
    (patch: Partial<OfferDraftFieldCapture>): void => {
      setDraft((prev) => {
        const next: OfferDraft = { ...prev, fieldCapture: { ...prev.fieldCapture, ...patch } };
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  const updateChecklist = useCallback(
    (patch: Partial<OfferDraftChecklist>): void => {
      setDraft((prev) => {
        const next: OfferDraft = { ...prev, checklist: { ...prev.checklist, ...patch } };
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  const updatePricing = useCallback(
    (patch: Partial<OfferDraftPricing>): void => {
      setDraft((prev) => {
        const next: OfferDraft = { ...prev, pricing: { ...prev.pricing, ...patch } };
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  // ── Transition ──────────────────────────────────────────────────────────────

  const transitionToFull = useCallback((): boolean => {
    // Guard: transition direction must be quick → full (§19.4).
    if (!isValidModeTransition(draft.mode, 'full')) {
      return false;
    }

    // Guard: all 4 §19.3 conditions must be satisfied.
    const check = isReadyForTransition(draft);
    if (!check.ok) {
      return false;
    }

    // Apply: mode quick → full. All other data preserved verbatim (§19.4).
    // sourceContext.createdFrom intentionally NOT changed — stays 'quick-mode'.
    const next: OfferDraft = {
      ...draft,
      mode: 'full',
    };

    setDraft(next);
    scheduleSave(next);

    // Fire analytics after successful transition only (§20).
    trackEvent(ANALYTICS_EVENTS.OFFER_QUICK_TO_FULL, {
      draftId: draft.id,
      source: 'quick-mode',
    });

    return true;
  }, [draft, scheduleSave]);

  // ── Derived state ───────────────────────────────────────────────────────────

  const transitionCheck = useMemo(() => isReadyForTransition(draft), [draft]);

  return {
    draft,
    canTransitionToFull: transitionCheck.ok,
    missingTransitionFields: transitionCheck.failedConditions,
    updateClient,
    updateFieldCapture,
    updateChecklist,
    updatePricing,
    transitionToFull,
  };
}
