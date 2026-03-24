/**
 * DraftContext — single source of truth for OfferDraft across navigation.
 *
 * SOURCE OF TRUTH: docs/ULTRA_ENTERPRISE_ROADMAP.md §19, §19.3, §19.4, §24
 *
 * Root cause fix (Gate 1 blocker):
 * QuickMode and QuickEstimateWorkspace previously held separate, disconnected
 * draft state. This context is the shared owner — it survives React component
 * unmount/mount cycles (navigation) and persists to IndexedDB so page-reload
 * recovery works in QuickEstimateWorkspace.
 *
 * Architecture:
 * - One context instance per app session (mounted at App root).
 * - draft_id generated once via initDraft(), never replaced (§19.4).
 * - Persisted to IndexedDB on every update → survives page reload.
 * - initDraft(userId) must be called by QuickMode on mount when no in-progress
 *   quick-mode draft is available in the context.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { get, set, del } from 'idb-keyval';
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

// ── Constants ──────────────────────────────────────────────────────────────────

/** IndexedDB key for the currently active offer draft. Separate from the sync queue. */
export const ACTIVE_DRAFT_IDB_KEY = 'qm-active-draft-v1';

// ── Internal helpers (match useDraft.ts exactly) ───────────────────────────────

function generateDraftId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function detectDeviceType(): DraftDeviceType {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

export function createFreshDraft(ownerUserId: string): OfferDraft {
  return {
    id: generateDraftId(),
    mode: 'quick',
    status: 'draft',
    ownerUserId,
    client: { id: null, tempName: null, tempPhone: null, tempEmail: null },
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

// ── All transition conditions (used when draft is null) ───────────────────────

const ALL_CONDITIONS: TransitionCondition[] = [
  'draft_id_exists',
  'owner_user_id_assigned',
  'client_identified',
  'min_context_source_present',
];

// ── Context shape ──────────────────────────────────────────────────────────────

export interface DraftContextValue {
  /** Current draft. null while IDB hydration is in progress or no draft yet. */
  draft: OfferDraft | null;

  /** True while the initial IDB read is in progress on first mount. */
  isHydrating: boolean;

  /** True when all §19.3 transition conditions are satisfied. */
  canTransitionToFull: boolean;

  /** List of §19.3 conditions not yet satisfied. Empty when canTransitionToFull is true. */
  missingTransitionFields: TransitionCondition[];

  /**
   * Creates and activates a new fresh draft. Must be called by QuickMode on mount
   * when no in-progress quick-mode draft is available (draft is null or mode='full').
   */
  initDraft: (ownerUserId: string) => void;

  /** Merge-update the client block. Persists to IDB + offline queue. */
  updateClient: (patch: Partial<OfferDraftClient>) => void;

  /** Merge-update the fieldCapture block. Persists to IDB + offline queue. */
  updateFieldCapture: (patch: Partial<OfferDraftFieldCapture>) => void;

  /** Merge-update the checklist block. Persists to IDB + offline queue. */
  updateChecklist: (patch: Partial<OfferDraftChecklist>) => void;

  /** Merge-update the pricing block. Persists to IDB + offline queue. */
  updatePricing: (patch: Partial<OfferDraftPricing>) => void;

  /**
   * Attempt Quick→Full transition (§19.4 Expansion Rule).
   * Returns true on success, false if conditions not met or already 'full'.
   * On success: mode becomes 'full', draft_id unchanged, OFFER_QUICK_TO_FULL fires.
   */
  transitionToFull: () => boolean;

  /** Removes the active draft from IDB and resets context state. */
  clearDraft: () => Promise<void>;
}

const DraftContext = createContext<DraftContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────────

interface DraftProviderProps {
  children: ReactNode;
}

export function DraftProvider({ children }: DraftProviderProps) {
  const [draft, setDraft] = useState<OfferDraft | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  // Ref so transitionToFull always reads the latest draft without stale closures.
  const draftRef = useRef<OfferDraft | null>(null);
  draftRef.current = draft;

  // ── IDB hydration on mount ──────────────────────────────────────────────────

  useEffect(() => {
    // idb-keyval's get() can throw synchronously (ReferenceError) when indexedDB
    // is not available (e.g. some WebViews, strict privacy modes).  A .catch()
    // handler only catches *rejected promises*, not synchronous throws.
    // Wrapping in try/catch ensures we never crash the component tree.
    try {
      get<OfferDraft>(ACTIVE_DRAFT_IDB_KEY)
        .then((stored) => {
          if (stored) setDraft(stored);
        })
        .catch(() => {
          // IDB unavailable (e.g. private browsing in Safari) — start empty, continue normally.
        })
        .finally(() => setIsHydrating(false));
    } catch {
      // indexedDB not defined or inaccessible — proceed without persisted draft.
      setIsHydrating(false);
    }
  }, []);

  // ── Dual persistence: IDB (active draft state) + offline queue (sync) ───────

  const persist = useCallback((d: OfferDraft): void => {
    // idb-keyval can throw synchronously when indexedDB is unavailable.
    try {
      // Primary: IDB active-draft key — read back for page-reload hydration.
      void set(ACTIVE_DRAFT_IDB_KEY, d).catch(() => {});
    } catch { /* indexedDB unavailable */ }
    try {
      // Secondary: offline queue — for eventual server sync (§25.1).
      void addEntry('OFFER_DRAFT_SAVE', { draftId: d.id, draft: d }).catch(() => {});
    } catch { /* offline queue unavailable */ }
  }, []);

  // ── initDraft ───────────────────────────────────────────────────────────────

  const initDraft = useCallback(
    (ownerUserId: string): void => {
      const fresh = createFreshDraft(ownerUserId);
      setDraft(fresh);
      persist(fresh);
    },
    [persist],
  );

  // ── Field-group updaters ────────────────────────────────────────────────────

  const updateClient = useCallback(
    (patch: Partial<OfferDraftClient>): void => {
      setDraft((prev) => {
        if (!prev) return prev;
        const next: OfferDraft = { ...prev, client: { ...prev.client, ...patch } };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const updateFieldCapture = useCallback(
    (patch: Partial<OfferDraftFieldCapture>): void => {
      setDraft((prev) => {
        if (!prev) return prev;
        const next: OfferDraft = { ...prev, fieldCapture: { ...prev.fieldCapture, ...patch } };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const updateChecklist = useCallback(
    (patch: Partial<OfferDraftChecklist>): void => {
      setDraft((prev) => {
        if (!prev) return prev;
        const next: OfferDraft = { ...prev, checklist: { ...prev.checklist, ...patch } };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const updatePricing = useCallback(
    (patch: Partial<OfferDraftPricing>): void => {
      setDraft((prev) => {
        if (!prev) return prev;
        const next: OfferDraft = { ...prev, pricing: { ...prev.pricing, ...patch } };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  // ── transitionToFull ────────────────────────────────────────────────────────

  const transitionToFull = useCallback((): boolean => {
    const current = draftRef.current;
    if (!current) return false;
    if (!isValidModeTransition(current.mode, 'full')) return false;

    const check = isReadyForTransition(current);
    if (!check.ok) return false;

    // Apply: mode quick → full. All other data preserved verbatim (§19.4).
    // sourceContext.createdFrom intentionally stays 'quick-mode' for analytics.
    const next: OfferDraft = { ...current, mode: 'full' };
    setDraft(next);
    persist(next);

    // Fire analytics after successful transition only (§20).
    trackEvent(ANALYTICS_EVENTS.OFFER_QUICK_TO_FULL, {
      draftId: current.id,
      source: 'quick-mode',
    });

    return true;
  }, [persist]);

  // ── clearDraft ──────────────────────────────────────────────────────────────

  const clearDraft = useCallback(async (): Promise<void> => {
    setDraft(null);
    try {
      await del(ACTIVE_DRAFT_IDB_KEY).catch(() => {});
    } catch { /* indexedDB unavailable */ }
  }, []);

  // ── Derived state ───────────────────────────────────────────────────────────

  const transitionCheck = useMemo(
    () =>
      draft
        ? isReadyForTransition(draft)
        : { ok: false, failedConditions: ALL_CONDITIONS },
    [draft],
  );

  const value = useMemo<DraftContextValue>(
    () => ({
      draft,
      isHydrating,
      canTransitionToFull: transitionCheck.ok,
      missingTransitionFields: transitionCheck.failedConditions,
      initDraft,
      updateClient,
      updateFieldCapture,
      updateChecklist,
      updatePricing,
      transitionToFull,
      clearDraft,
    }),
    [
      draft,
      isHydrating,
      transitionCheck,
      initDraft,
      updateClient,
      updateFieldCapture,
      updateChecklist,
      updatePricing,
      transitionToFull,
      clearDraft,
    ],
  );

  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

// ── Consumer hook ──────────────────────────────────────────────────────────────

/**
 * useDraftContext — consume the shared draft state.
 * Must be called within a component rendered inside DraftProvider.
 */
export function useDraftContext(): DraftContextValue {
  const ctx = useContext(DraftContext);
  if (!ctx) {
    throw new Error('useDraftContext must be used within a DraftProvider');
  }
  return ctx;
}
