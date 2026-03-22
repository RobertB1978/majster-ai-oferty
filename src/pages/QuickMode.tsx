/**
 * QuickMode — Gate 1 Condition 1: fachowiec może zebrać dane w Quick Mode
 * jedną ręką na mobile.
 *
 * SOURCE OF TRUTH: docs/ULTRA_ENTERPRISE_ROADMAP.md §0.4, §2.2, §3.7, §19.2,
 * §19.3, §20, §24, §25.1
 *
 * This page:
 * - Composes existing field-capture components (E1-C) and draft engine (E1-B).
 * - Does NOT rewrite their internals.
 * - Adds /app/quick-mode route (see App.tsx).
 * - Fires OFFER_QUICK_STARTED on first mount.
 * - Disables CTA until all 4 §19.3 conditions are met.
 * - Persists form fields to sessionStorage for within-session navigation.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import {
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Loader2,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  PhotoCapture,
  TextNote,
  ChecklistPanel,
} from '@/components/field-capture';
import type { PhotoCapturePhoto } from '@/components/field-capture';
import { useDraftContext } from '@/contexts/DraftContext';
import { useAuth } from '@/contexts/AuthContext';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';
import { trackEvent } from '@/lib/analytics/track';
import type { TransitionCondition } from '@/types/offer-draft-helpers';
import type { OfferDraftChecklist } from '@/types/offer-draft';

// ── Session persistence ──────────────────────────────────────────────────────

const SESSION_KEY = 'qm_draft_v1';

interface PersistedFields {
  clientName: string;
  clientPhone: string;
  note: string;
  checklist: OfferDraftChecklist;
}

function readSession(): PersistedFields | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedFields;
  } catch {
    return null;
  }
}

function writeSession(fields: PersistedFields): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(fields));
  } catch {
    // sessionStorage unavailable — silent fail
  }
}

function clearSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

// ── Missing condition → human-readable message map ───────────────────────────

const CONDITION_TO_I18N_KEY: Record<TransitionCondition, string> = {
  draft_id_exists: 'quickMode.missing.draftId',
  owner_user_id_assigned: 'quickMode.missing.ownerUserId',
  client_identified: 'quickMode.missing.clientIdentified',
  min_context_source_present: 'quickMode.missing.contextSource',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function QuickMode() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id ?? '';

  // Shared draft engine — survives navigation so data carries into QuickEstimateWorkspace.
  const {
    draft,
    isHydrating,
    canTransitionToFull,
    missingTransitionFields,
    initDraft,
    updateClient,
    updateFieldCapture,
    updateChecklist,
    transitionToFull,
  } = useDraftContext();

  // ── Init draft on QuickMode entry ────────────────────────────────────────
  // After IDB hydration completes, create a fresh draft when:
  //   a) no draft exists yet (first visit), or
  //   b) the previous draft already transitioned to Full Mode (new session).
  // If an in-progress quick-mode draft was hydrated from IDB, reuse it.
  const initFiredRef = useRef(false);
  useEffect(() => {
    if (isHydrating) return;
    if (initFiredRef.current) return;
    initFiredRef.current = true;
    if (draft === null || draft.mode === 'full') {
      initDraft(userId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrating]);

  // ── Local display state ──────────────────────────────────────────────────

  // Preview photos (previewUrl is local only — not stored in DraftPhoto)
  const [displayPhotos, setDisplayPhotos] = useState<PhotoCapturePhoto[]>([]);

  // Text note — drives updateFieldCapture
  const [note, setNote] = useState('');

  // Temporary client fields
  const [tempName, setTempName] = useState('');
  const [tempPhone, setTempPhone] = useState('');

  // CTA transition loading state
  const [transitioning, setTransitioning] = useState(false);

  // Guards for one-shot effects
  const startedFiredRef = useRef(false);
  const restoredRef = useRef(false);

  // ── Session restore on mount ────────────────────────────────────────────

  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    const saved = readSession();
    if (!saved) return;

    if (saved.clientName) {
      setTempName(saved.clientName);
      updateClient({ tempName: saved.clientName, tempPhone: saved.clientPhone || null });
    }
    if (saved.clientPhone) {
      setTempPhone(saved.clientPhone);
    }
    if (saved.note) {
      setNote(saved.note);
      updateFieldCapture({ textNote: saved.note });
    }
    if (saved.checklist) {
      updateChecklist(saved.checklist);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Session save on field change ────────────────────────────────────────

  useEffect(() => {
    if (!restoredRef.current || !draft) return;
    writeSession({
      clientName: tempName,
      clientPhone: tempPhone,
      note,
      checklist: draft.checklist,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempName, tempPhone, note, draft?.checklist]);

  // ── Analytics: fire OFFER_QUICK_STARTED once a draft is available ───────
  // Depends on draft?.id so it re-evaluates when initDraft creates the draft.

  useEffect(() => {
    if (startedFiredRef.current || !draft) return;
    startedFiredRef.current = true;
    trackEvent(ANALYTICS_EVENTS.OFFER_QUICK_STARTED, {
      draftId: draft.id,
      source: 'quick-mode',
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?.id]);

  // ── Photo handlers ──────────────────────────────────────────────────────

  // Null-safe photos array — draft is null during IDB hydration.
  const currentPhotos = draft?.fieldCapture.photos ?? [];

  const handlePhotoAdd = useCallback(
    (file: File) => {
      const id = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);

      setDisplayPhotos((prev) => [...prev, { id, previewUrl, caption: null }]);

      updateFieldCapture({
        photos: [
          ...currentPhotos,
          { id, storagePath: '', localQueueId: id, caption: null, category: null },
        ],
      });
    },
    [currentPhotos, updateFieldCapture],
  );

  const handlePhotoRemove = useCallback(
    (id: string) => {
      setDisplayPhotos((prev) => {
        const removed = prev.find((p) => p.id === id);
        if (removed) URL.revokeObjectURL(removed.previewUrl);
        return prev.filter((p) => p.id !== id);
      });

      updateFieldCapture({
        photos: currentPhotos.filter((p) => p.id !== id),
      });
    },
    [currentPhotos, updateFieldCapture],
  );

  // ── Note handler ────────────────────────────────────────────────────────

  const handleNoteChange = useCallback(
    (value: string) => {
      setNote(value);
      updateFieldCapture({ textNote: value || null });
    },
    [updateFieldCapture],
  );

  // ── Client handlers ─────────────────────────────────────────────────────

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setTempName(v);
      updateClient({ tempName: v || null, tempPhone: tempPhone || null });
    },
    [updateClient, tempPhone],
  );

  const handlePhoneChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setTempPhone(v);
      updateClient({ tempName: tempName || null, tempPhone: v || null });
    },
    [updateClient, tempName],
  );

  // ── Checklist handler ───────────────────────────────────────────────────

  const handleChecklistChange = useCallback(
    (updated: OfferDraftChecklist) => {
      updateChecklist(updated);
    },
    [updateChecklist],
  );

  // ── CTA: transition + navigate ──────────────────────────────────────────

  const handleStart = useCallback(() => {
    if (!canTransitionToFull || transitioning) return;
    setTransitioning(true);

    if (!draft) return;
    const draftIdBefore = draft.id;

    const ok = transitionToFull();
    if (ok) {
      // §19.4 proof: draft_id must be identical before and after transition
      // eslint-disable-next-line no-console
      console.info(
        '[Quick→Full] draft_id before=%s after=%s identical=%s',
        draftIdBefore,
        draft.id,
        draftIdBefore === draft.id,
      );

      // Clear session storage after successful transition to avoid stale data
      clearSession();
      // Navigate to Full Mode with draft_id as canonical identifier
      navigate(`/app/offers/new?draft_id=${encodeURIComponent(draftIdBefore)}`, { replace: false });
    } else {
      setTransitioning(false);
    }
  }, [canTransitionToFull, transitioning, transitionToFull, navigate]);

  // ── Derive CTA hint text ────────────────────────────────────────────────

  const ctaHint = missingTransitionFields.length > 0
    ? missingTransitionFields
        .map((c) => t(CONDITION_TO_I18N_KEY[c]))
        .join(' · ')
    : '';

  // ── Guard: show spinner while IDB hydrates or draft is being created ────
  // Hooks are all called above; this JSX-level return is safe.

  if (isHydrating || !draft) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" aria-hidden />
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      <Helmet>
        <title>{t('quickMode.pageTitle')} | Majster.AI</title>
      </Helmet>

      {/*
        Scrollable content area.
        Bottom padding reserves space for the sticky CTA bar (≈ 80px).
        max-w-lg centers content on tablets/desktop while keeping full-width on 390px.
      */}
      <div className="max-w-lg mx-auto space-y-4 pb-24 px-4 pt-2">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            aria-label={t('common.back')}
            className="min-h-[48px] min-w-[48px] shrink-0 p-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <h1 className="flex items-center gap-2 text-lg font-bold leading-tight text-[var(--text-primary)]">
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-amber)]">
              <Zap className="h-3.5 w-3.5 text-white" aria-hidden />
            </span>
            {t('quickMode.pageTitle')}
          </h1>
        </div>

        {/*
          ── 1. PHOTO CAPTURE — first above fold §0.4 ──────────────────────
          Renders camera + gallery buttons (min-h-[48px] each, side-by-side).
          On 390px: two full-width buttons visible immediately.
        */}
        <section aria-label={t('fieldCapture.photo.addPhoto')}>
          <PhotoCapture
            photos={displayPhotos}
            onAdd={handlePhotoAdd}
            onRemove={handlePhotoRemove}
          />
        </section>

        {/*
          ── 2. TEXT NOTE — visible on first screen §0.4 ───────────────────
          Auto-expanding textarea, minRows=2 to stay compact above fold.
        */}
        <section>
          <TextNote
            value={note}
            onChange={handleNoteChange}
            minRows={2}
          />
        </section>

        {/*
          ── 3. CLIENT — imię + telefon §0.4 ──────────────────────────────
          Two simple inputs inside a bordered card.
          touch targets: min-h-[48px] on each input.
        */}
        <section
          className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 space-y-3"
          aria-label={t('quickMode.client.title')}
        >
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {t('quickMode.client.title')}
          </p>

          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="qm-client-name" className="text-xs font-medium">
                {t('quickMode.client.name')}
              </Label>
              <Input
                id="qm-client-name"
                value={tempName}
                onChange={handleNameChange}
                placeholder={t('quickMode.client.namePlaceholder')}
                autoComplete="off"
                className="min-h-[48px]"
                data-testid="qm-client-name"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="qm-client-phone" className="text-xs font-medium">
                {t('quickMode.client.phone')}
              </Label>
              <Input
                id="qm-client-phone"
                type="tel"
                inputMode="tel"
                value={tempPhone}
                onChange={handlePhoneChange}
                placeholder={t('quickMode.client.phonePlaceholder')}
                autoComplete="tel"
                className="min-h-[48px]"
                data-testid="qm-client-phone"
              />
            </div>
          </div>
        </section>

        {/*
          ── 4. CHECKLIST — dokumentacja klienta §0.4 ─────────────────────
          Uses ChecklistPanel from E1-C (read-only import — internals untouched).
        */}
        <section className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
          <ChecklistPanel
            checklist={draft.checklist}
            onChange={handleChecklistChange}
          />
        </section>

      </div>

      {/*
        ── STICKY BOTTOM CTA ────────────────────────────────────────────────
        Always visible. Disabled until all 4 §19.3 conditions are met.
        Tooltip + inline hint explain what's still missing.
      */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border-default)] bg-[var(--bg-base)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--bg-base)]/80 px-4 py-3 shadow-[var(--shadow-lg)]"
        data-testid="qm-cta-bar"
      >
        {/* Inline disabled hint — always visible, no tooltip required on mobile */}
        {!canTransitionToFull && ctaHint && (
          <p
            id="qm-cta-hint"
            className="mb-2 flex items-start gap-1.5 text-xs text-[var(--text-secondary)]"
            role="status"
            aria-live="polite"
            data-testid="qm-cta-hint"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            {ctaHint}
          </p>
        )}

        {/*
          Wrapping in Tooltip for desktop hover UX.
          The `span` wrapper is required because disabled buttons don't fire mouse events.
        */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="block">
              <Button
                size="lg"
                className="w-full min-h-[52px] text-base font-semibold"
                disabled={!canTransitionToFull || transitioning}
                onClick={handleStart}
                aria-describedby={!canTransitionToFull ? 'qm-cta-hint' : undefined}
                data-testid="qm-cta-button"
              >
                {transitioning ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden />
                ) : (
                  <ChevronRight className="mr-2 h-5 w-5" aria-hidden />
                )}
                {t('quickMode.cta')}
              </Button>
            </span>
          </TooltipTrigger>

          {!canTransitionToFull && ctaHint && (
            <TooltipContent
              side="top"
              className="max-w-[280px] text-center text-xs"
            >
              {ctaHint}
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </>
  );
}
