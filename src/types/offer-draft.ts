/**
 * OfferDraft Data Contract
 *
 * SOURCE OF TRUTH: docs/ULTRA_ENTERPRISE_ROADMAP.md — Section 19
 * Gate 0 Condition 3: OfferDraft interface zaimplementowany, TypeScript akceptuje.
 *
 * IMPORTANT: draft_id (id) is stable from first field capture through PDF generation.
 * It NEVER changes on Quick→Full transition (see section 19.4 Expansion Rule).
 */

// ── Mode & Status ─────────────────────────────────────────────────────────────

/** Offer draft authoring mode. One-way only: quick → full (never reversed). */
export type DraftMode = 'quick' | 'full';

/** Lifecycle status of the draft. */
export type DraftStatus =
  | 'draft'
  | 'pricing_in_progress'
  | 'ready_for_pdf'
  | 'sent';

// ── Source Context ────────────────────────────────────────────────────────────

/** How the draft was originally created. Preserved even after Quick→Full. */
export type DraftCreatedFrom = 'quick-mode' | 'full-mode' | 'template';

/** Device type at time of draft creation. */
export type DraftDeviceType = 'mobile' | 'tablet' | 'desktop';

// ── Field Capture ─────────────────────────────────────────────────────────────

/** Physical measurement unit for site captures. */
export type MeasurementUnit = 'm' | 'm2' | 'm3' | 'pcs' | 'mb';

/** A photo captured during site visit. */
export interface DraftPhoto {
  id: string;
  storagePath: string;
  /** Queue id for offline-first upload tracking; null when already synced. */
  localQueueId: string | null;
  caption: string | null;
  category: string | null;
}

/** A dimensional measurement taken at the site. */
export interface DraftMeasurement {
  label: string;
  value: number;
  unit: MeasurementUnit;
}

// ── Checklist ─────────────────────────────────────────────────────────────────

/** Status of the investor documentation question. */
export type DocumentationStatus = 'yes' | 'no' | 'waiting' | 'unknown';

/** Status of the investor cost estimate question. */
export type InvestorEstimateStatus = 'yes' | 'no' | 'checking' | 'unknown';

// ── Pricing ───────────────────────────────────────────────────────────────────

/** Origin of a line item entry. */
export type DraftLineItemSource = 'manual' | 'ai' | 'template';

/** Overall pricing workflow state. */
export type PricingState = 'not_started' | 'draft' | 'completed';

/** Pre-computed totals stored alongside each line item. */
export interface DraftLineItemTotals {
  net: number;
  gross: number;
}

/**
 * A single priced line item within OfferDraft.pricing.
 *
 * NOTE: This is a separate type from the WorkspaceLineItems.LineItem used in the
 * quick-estimate UI. They serve different layers (data contract vs. UI state).
 */
export interface DraftLineItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  unitPriceNet: number;
  /**
   * VAT rate as a percentage (e.g. 23 for 23%, 0 for zero-rate).
   * null = not yet configured — triggers §19.5 condition 4 (modal 'Netto czy brutto?').
   * Use pricing.isVatExempt = true to consciously waive VAT on all items.
   */
  vatRate: number | null;
  totals: DraftLineItemTotals;
  source: DraftLineItemSource;
}

/**
 * A named pricing variant (Full Mode only).
 *
 * NOTE: Distinct from WizardVariant (useOfferWizard.ts) which is a UI-layer type.
 */
export interface DraftVariant {
  id: string;
  label: string;
  lineItems: DraftLineItem[];
}

// ── Output ────────────────────────────────────────────────────────────────────

/** PDF generation state. */
export type PdfState = 'not_ready' | 'ready' | 'generated';

/** Public sharing link state. */
export type PublicLinkState = 'not_ready' | 'ready' | 'sent';

// ── Sub-objects of OfferDraft ─────────────────────────────────────────────────

/**
 * Client reference.
 * Either `id` (existing client) OR `tempName` + (`tempPhone` | `tempEmail`) for Quick Mode.
 */
export interface OfferDraftClient {
  /** Foreign key to existing client record, or null if using temp fields. */
  id: string | null;
  /** Temporary client name used in Quick Mode before full client creation. */
  tempName: string | null;
  /** Temporary phone used in Quick Mode. */
  tempPhone: string | null;
  /** Temporary email used in Quick Mode. */
  tempEmail: string | null;
}

/** Provenance metadata captured when the draft is first created. */
export interface OfferDraftSourceContext {
  createdFrom: DraftCreatedFrom;
  deviceType: DraftDeviceType;
  /** ISO 8601 timestamp of first save. */
  startedAt: string;
}

/** Everything captured during the site visit / field phase. */
export interface OfferDraftFieldCapture {
  photos: DraftPhoto[];
  textNote: string | null;
  voiceNotePath: string | null;
  measurements: DraftMeasurement[];
}

/** Structured questions answered during client scoping. */
export interface OfferDraftChecklist {
  hasDocumentation: DocumentationStatus;
  hasInvestorEstimate: InvestorEstimateStatus;
  clientRequirements: string | null;
  siteConstraints: string | null;
}

/** Pricing section — populated during Full Mode. */
export interface OfferDraftPricing {
  lineItems: DraftLineItem[];
  /** Non-null only in Full Mode when variants have been created. */
  variants: DraftVariant[] | null;
  /** Always PLN for this product. */
  currency: 'PLN';
  pricingState: PricingState;
  /**
   * True when the contractor consciously chose VAT-exempt invoicing.
   * Required to satisfy PDF readiness condition 4 (section 19.5).
   */
  isVatExempt: boolean;
}

/** Output / delivery state. */
export interface OfferDraftOutput {
  pdfState: PdfState;
  publicLinkState: PublicLinkState;
}

// ── Root Interface ────────────────────────────────────────────────────────────

/**
 * OfferDraft — the central data contract for the offer creation flow.
 *
 * Section 19.1 of docs/ULTRA_ENTERPRISE_ROADMAP.md.
 *
 * Identity rules (section 19.4 Expansion Rule):
 * - `id` is readonly and NEVER reassigned after creation.
 * - `mode` can only transition quick → full; reverse is forbidden.
 * - All Quick Mode data is preserved verbatim when expanding to Full Mode.
 */
export interface OfferDraft {
  /** Stable draft identity. Assigned once at Quick Mode creation. Never reassigned. */
  readonly id: string;
  /** Authoring mode. Can only progress quick → full; never reversed. */
  mode: DraftMode;
  status: DraftStatus;
  /** ID of the authenticated user who owns this draft. Required from creation. */
  ownerUserId: string;
  client: OfferDraftClient;
  sourceContext: OfferDraftSourceContext;
  fieldCapture: OfferDraftFieldCapture;
  checklist: OfferDraftChecklist;
  pricing: OfferDraftPricing;
  output: OfferDraftOutput;
}
