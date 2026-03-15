/**
 * Unit tests for draft-validation.ts
 *
 * Covers all 6 required cases from the task specification:
 *   1. valid quick draft
 *   2. invalid transition state
 *   3. valid transition state
 *   4. valid PDF-ready state
 *   5. invalid PDF-ready state
 *   6. mode transition constraints
 */

import { describe, it, expect } from 'vitest';
import { isReadyForTransition, isReadyForPDF, isDraftValid } from './draft-validation';
import { isValidModeTransition } from '@/types/offer-draft-helpers';
import type { OfferDraft, DraftLineItem } from '@/types/offer-draft';

// ── Factories ─────────────────────────────────────────────────────────────────

function makeLineItem(overrides: Partial<DraftLineItem> = {}): DraftLineItem {
  return {
    id: 'item-1',
    name: 'Robocizna malarza',
    qty: 10,
    unit: 'm2',
    unitPriceNet: 25,
    vatRate: 23,
    totals: { net: 250, gross: 307.5 },
    source: 'manual',
    ...overrides,
  };
}

function makeQuickDraft(overrides: Partial<OfferDraft> = {}): OfferDraft {
  return {
    id: 'draft-abc123',
    mode: 'quick',
    status: 'draft',
    ownerUserId: 'user-xyz',
    client: {
      id: null,
      tempName: 'Jan Kowalski',
      tempPhone: '500100200',
      tempEmail: null,
    },
    sourceContext: {
      createdFrom: 'quick-mode',
      deviceType: 'mobile',
      startedAt: '2026-03-15T08:00:00.000Z',
    },
    fieldCapture: {
      photos: [{ id: 'p1', storagePath: '/photos/p1.jpg', localQueueId: null, caption: null, category: null }],
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
    ...overrides,
  };
}

function makePdfReadyDraft(): OfferDraft {
  return {
    ...makeQuickDraft(),
    mode: 'full',
    status: 'ready_for_pdf',
    pricing: {
      lineItems: [makeLineItem()],
      variants: null,
      currency: 'PLN',
      pricingState: 'completed',
      isVatExempt: false,
    },
    output: {
      pdfState: 'ready',
      publicLinkState: 'not_ready',
    },
  };
}

// ── 1. Valid quick draft ──────────────────────────────────────────────────────

describe('isDraftValid — valid quick draft', () => {
  it('returns true for a minimal valid Quick Mode draft', () => {
    const draft = makeQuickDraft();
    expect(isDraftValid(draft)).toBe(true);
  });

  it('returns true when client is identified via id only', () => {
    const draft = makeQuickDraft({
      client: { id: 'client-999', tempName: null, tempPhone: null, tempEmail: null },
    });
    expect(isDraftValid(draft)).toBe(true);
  });

  it('returns true when context comes from textNote (no photos)', () => {
    const draft = makeQuickDraft({
      fieldCapture: {
        photos: [],
        textNote: 'Malowanie ścian salonu ok. 40m2',
        voiceNotePath: null,
        measurements: [],
      },
    });
    expect(isDraftValid(draft)).toBe(true);
  });

  it('returns true when context comes only from checklist answer', () => {
    const draft = makeQuickDraft({
      fieldCapture: { photos: [], textNote: null, voiceNotePath: null, measurements: [] },
      checklist: {
        hasDocumentation: 'yes',
        hasInvestorEstimate: 'unknown',
        clientRequirements: null,
        siteConstraints: null,
      },
    });
    expect(isDraftValid(draft)).toBe(true);
  });

  it('returns false when id is missing', () => {
    const draft = makeQuickDraft({ id: '' });
    expect(isDraftValid(draft)).toBe(false);
  });

  it('returns false when ownerUserId is missing', () => {
    const draft = makeQuickDraft({ ownerUserId: '' });
    expect(isDraftValid(draft)).toBe(false);
  });
});

// ── 2. Invalid transition state ───────────────────────────────────────────────

describe('isReadyForTransition — invalid cases', () => {
  it('fails when id is empty', () => {
    const result = isReadyForTransition(makeQuickDraft({ id: '' }));
    expect(result.ok).toBe(false);
    expect(result.failedConditions).toContain('draft_id_exists');
  });

  it('fails when ownerUserId is empty', () => {
    const result = isReadyForTransition(makeQuickDraft({ ownerUserId: '' }));
    expect(result.ok).toBe(false);
    expect(result.failedConditions).toContain('owner_user_id_assigned');
  });

  it('fails when client has no id and no tempName', () => {
    const draft = makeQuickDraft({
      client: { id: null, tempName: null, tempPhone: '500100200', tempEmail: null },
    });
    const result = isReadyForTransition(draft);
    expect(result.ok).toBe(false);
    expect(result.failedConditions).toContain('client_identified');
  });

  it('fails when client has tempName but no contact method', () => {
    const draft = makeQuickDraft({
      client: { id: null, tempName: 'Jan', tempPhone: null, tempEmail: null },
    });
    const result = isReadyForTransition(draft);
    expect(result.ok).toBe(false);
    expect(result.failedConditions).toContain('client_identified');
  });

  it('fails when there is no context source (no photos, no note, no checklist)', () => {
    const draft = makeQuickDraft({
      fieldCapture: { photos: [], textNote: null, voiceNotePath: null, measurements: [] },
      checklist: {
        hasDocumentation: 'unknown',
        hasInvestorEstimate: 'unknown',
        clientRequirements: null,
        siteConstraints: null,
      },
    });
    const result = isReadyForTransition(draft);
    expect(result.ok).toBe(false);
    expect(result.failedConditions).toContain('min_context_source_present');
  });

  it('reports all failed conditions when multiple issues exist', () => {
    const result = isReadyForTransition({
      ...makeQuickDraft(),
      id: '',
      ownerUserId: '',
      client: { id: null, tempName: null, tempPhone: null, tempEmail: null },
      fieldCapture: { photos: [], textNote: null, voiceNotePath: null, measurements: [] },
    });
    expect(result.ok).toBe(false);
    expect(result.failedConditions).toHaveLength(4);
  });
});

// ── 3. Valid transition state ─────────────────────────────────────────────────

describe('isReadyForTransition — valid cases', () => {
  it('returns ok=true for a complete quick draft with photo', () => {
    const result = isReadyForTransition(makeQuickDraft());
    expect(result.ok).toBe(true);
    expect(result.failedConditions).toHaveLength(0);
  });

  it('accepts client identified by existing id', () => {
    const draft = makeQuickDraft({
      client: { id: 'client-001', tempName: null, tempPhone: null, tempEmail: null },
    });
    const result = isReadyForTransition(draft);
    expect(result.ok).toBe(true);
  });

  it('accepts context from textNote alone', () => {
    const draft = makeQuickDraft({
      fieldCapture: { photos: [], textNote: 'Wymiana instalacji elektrycznej', voiceNotePath: null, measurements: [] },
    });
    const result = isReadyForTransition(draft);
    expect(result.ok).toBe(true);
  });

  it('accepts context from checklist alone (hasDocumentation answered)', () => {
    const draft = makeQuickDraft({
      fieldCapture: { photos: [], textNote: null, voiceNotePath: null, measurements: [] },
      checklist: {
        hasDocumentation: 'no',
        hasInvestorEstimate: 'unknown',
        clientRequirements: null,
        siteConstraints: null,
      },
    });
    const result = isReadyForTransition(draft);
    expect(result.ok).toBe(true);
  });

  it('accepts tempName + tempEmail (no phone) as valid client', () => {
    const draft = makeQuickDraft({
      client: { id: null, tempName: 'Anna', tempPhone: null, tempEmail: 'anna@example.com' },
    });
    const result = isReadyForTransition(draft);
    expect(result.ok).toBe(true);
  });
});

// ── 4. Valid PDF-ready state ──────────────────────────────────────────────────

describe('isReadyForPDF — valid cases', () => {
  it('returns ok=true for a complete full-mode draft', () => {
    const result = isReadyForPDF(makePdfReadyDraft());
    expect(result.ok).toBe(true);
    expect(result.failedConditions).toHaveLength(0);
  });

  it('accepts VAT-exempt draft (isVatExempt=true, vatRate=0)', () => {
    const draft = makePdfReadyDraft();
    draft.pricing.isVatExempt = true;
    draft.pricing.lineItems = [makeLineItem({ vatRate: 0 })];
    const result = isReadyForPDF(draft);
    expect(result.ok).toBe(true);
  });

  it('accepts draft with items spread across variants', () => {
    const draft = makePdfReadyDraft();
    draft.pricing.lineItems = [];
    draft.pricing.variants = [
      { id: 'v1', label: 'Wariant A', lineItems: [makeLineItem({ id: 'v1-i1' })] },
    ];
    const result = isReadyForPDF(draft);
    expect(result.ok).toBe(true);
  });
});

// ── 5. Invalid PDF-ready state ────────────────────────────────────────────────

describe('isReadyForPDF — invalid cases', () => {
  it('fails when there are no line items', () => {
    const draft = makePdfReadyDraft();
    draft.pricing.lineItems = [];
    const result = isReadyForPDF(draft);
    expect(result.ok).toBe(false);
    expect(result.failedConditions).toContain('min_one_line_item');
  });

  it('fails when pricing state is not completed', () => {
    const draft = makePdfReadyDraft();
    draft.pricing.pricingState = 'draft';
    const result = isReadyForPDF(draft);
    expect(result.ok).toBe(false);
    expect(result.failedConditions).toContain('pricing_state_completed');
  });

  it('fails when a line item has empty name', () => {
    const draft = makePdfReadyDraft();
    draft.pricing.lineItems = [makeLineItem({ name: '' })];
    const result = isReadyForPDF(draft);
    expect(result.ok).toBe(false);
    expect(result.failedConditions).toContain('all_line_items_complete');
  });

  it('fails when a line item has qty=0', () => {
    const draft = makePdfReadyDraft();
    draft.pricing.lineItems = [makeLineItem({ qty: 0 })];
    const result = isReadyForPDF(draft);
    expect(result.ok).toBe(false);
    expect(result.failedConditions).toContain('all_line_items_complete');
  });

  it('fails when client has no contact (tempName only, no id, no phone, no email)', () => {
    const draft = makePdfReadyDraft();
    draft.client = { id: null, tempName: 'Jan', tempPhone: null, tempEmail: null };
    const result = isReadyForPDF(draft);
    expect(result.ok).toBe(false);
    expect(result.failedConditions).toContain('client_has_name_and_contact');
  });

  it('fails when vatRate is null and isVatExempt is false (VAT not configured)', () => {
    const draft = makePdfReadyDraft();
    draft.pricing.isVatExempt = false;
    draft.pricing.lineItems = [makeLineItem({ vatRate: null })];
    const result = isReadyForPDF(draft);
    expect(result.ok).toBe(false);
    expect(result.failedConditions).toContain('vat_configured');
  });
});

// ── Additional coverage: existing client path ─────────────────────────────────

describe('isReadyForPDF — existing client identified by id', () => {
  it('passes condition 1 when client.id is set (existing client on file)', () => {
    const draft = makePdfReadyDraft();
    draft.client = { id: 'client-db-001', tempName: null, tempPhone: null, tempEmail: null };
    const result = isReadyForPDF(draft);
    expect(result.ok).toBe(true);
  });
});

// ── 6. Mode transition constraints ───────────────────────────────────────────

describe('isValidModeTransition — mode transition constraints', () => {
  it('allows quick → full (the only valid transition)', () => {
    expect(isValidModeTransition('quick', 'full')).toBe(true);
  });

  it('forbids full → quick (reverse transition)', () => {
    expect(isValidModeTransition('full', 'quick')).toBe(false);
  });

  it('forbids quick → quick (same mode, no-op)', () => {
    expect(isValidModeTransition('quick', 'quick')).toBe(false);
  });

  it('forbids full → full (already full, no further mode)', () => {
    expect(isValidModeTransition('full', 'full')).toBe(false);
  });
});
