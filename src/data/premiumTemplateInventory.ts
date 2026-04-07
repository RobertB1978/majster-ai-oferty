/**
 * premiumTemplateInventory.ts — PR-B5 (Owner Content Pipeline)
 *
 * Single source of truth for the premium DOCX template inventory.
 * Defines every template the owner is expected to prepare and upload manually.
 *
 * WHAT THIS FILE IS:
 *   Operational manifest — describes what templates exist, what DOCX files
 *   must be uploaded to Supabase Storage, what category/tier they belong to,
 *   and what the expected storage path is.
 *
 * WHAT THIS FILE IS NOT:
 *   - Not the document content (content lives in DOCX files in Storage)
 *   - Not UI display-only metadata (see modeBContractTemplates.ts for descriptions)
 *   - Not a DB seed (see migrations/20260407100000_pr05a_seed_master_templates.sql)
 *
 * HOW TO ADD A NEW TEMPLATE:
 *   1. Add an entry to PREMIUM_TEMPLATE_INVENTORY here (this file = source of truth)
 *   2. Create a DB migration to INSERT into document_master_templates with is_active=false
 *   3. Author the real DOCX file
 *   4. Upload DOCX to Supabase Storage at expectedStoragePath
 *   5. Activate in DB: UPDATE SET is_active=true WHERE template_key='...'
 *   See docs/PREMIUM_DOCX_ONBOARDING.md for the full owner workflow.
 *
 * PATH CONVENTION:
 *   masters/{template_key}/v{version}/{template_key}.docx
 *   Matches buildMasterDocxPath() in src/lib/modeBFileFlow.ts.
 *   Must match docx_master_path in document_master_templates DB record.
 */

import type { MasterTemplateCategory, QualityTier } from '@/types/document-mode-b';

// ── Inventory entry type ──────────────────────────────────────────────────────

export interface PremiumTemplateInventoryEntry {
  /** Matches document_master_templates.template_key (DB) */
  templateKey: string;
  /** Polish display name — must match DB name field */
  name: string;
  /** Document category — must match DB category field */
  category: MasterTemplateCategory;
  /** Quality tier — must match DB quality_tier field */
  qualityTier: QualityTier;
  /** Semantic version — must match DB version field */
  version: string;
  /**
   * Expected path in Supabase Storage bucket 'document-masters'.
   * Owner must upload the DOCX to exactly this path before activation.
   * Derived from buildMasterDocxPath(templateKey, version).
   */
  expectedStoragePath: string;
  /**
   * Ops note for the owner describing what the document covers.
   * Not shown to end users — used in diagnostic view only.
   */
  contentNote: string;
}

// ── Inventory ─────────────────────────────────────────────────────────────────

/**
 * Complete inventory of premium DOCX templates for Mode B.
 *
 * READINESS RULES — a template is publish-safe only when ALL are true:
 *   1. DB record exists in document_master_templates
 *   2. DB docx_master_path matches expectedStoragePath (set at seed time)
 *   3. DOCX file is physically uploaded to Supabase Storage at expectedStoragePath
 *   4. DB is_active = true (set by owner AFTER upload)
 *
 * Current scope: 5 standard-tier construction contracts (PR-05a + PR-B5).
 * Future scope: protocols, annexes, compliance docs (planned PR-05b/05c).
 */
export const PREMIUM_TEMPLATE_INVENTORY: readonly PremiumTemplateInventoryEntry[] = [
  {
    templateKey: 'contract_fixed_price_standard',
    name: 'Umowa o roboty budowlane \u2014 rycza\u0142t',
    category: 'CONTRACTS',
    qualityTier: 'standard',
    version: '1.0',
    expectedStoragePath:
      'masters/contract_fixed_price_standard/v1.0/contract_fixed_price_standard.docx',
    contentNote:
      'Umowa z wynagrodzeniem rycza\u0142towym. Pe\u0142ny zakres rob\u00f3t z ustalonym z g\u00f3ry wynagrodzeniem.',
  },
  {
    templateKey: 'contract_cost_plus_standard',
    name: 'Umowa kosztorysowa (koszt + mar\u017ca)',
    category: 'CONTRACTS',
    qualityTier: 'standard',
    version: '1.0',
    expectedStoragePath:
      'masters/contract_cost_plus_standard/v1.0/contract_cost_plus_standard.docx',
    contentNote:
      'Rozliczenie na podstawie kosztorysu powykonawczego. Wynagrodzenie = udokumentowane koszty + mar\u017ca.',
  },
  {
    templateKey: 'contract_with_materials_standard',
    name: 'Umowa z klauzul\u0105 materia\u0142ow\u0105',
    category: 'CONTRACTS',
    qualityTier: 'standard',
    version: '1.0',
    expectedStoragePath:
      'masters/contract_with_materials_standard/v1.0/contract_with_materials_standard.docx',
    contentNote:
      'Umowa z podzia\u0142em odpowiedzialno\u015bci za materia\u0142y mi\u0119dzy Zamawiaj\u0105cym a Wykonawc\u0105.',
  },
  {
    templateKey: 'contract_with_advance_standard',
    name: 'Umowa z zaliczk\u0105 i etapami',
    category: 'CONTRACTS',
    qualityTier: 'standard',
    version: '1.0',
    expectedStoragePath:
      'masters/contract_with_advance_standard/v1.0/contract_with_advance_standard.docx',
    contentNote:
      'Zaliczka na pocz\u0105tku i rozliczenie etapowe. Harmonogram p\u0142atno\u015bci powi\u0105zany z etapami rob\u00f3t.',
  },
  {
    templateKey: 'contract_simple_order_standard',
    name: 'Zlecenie / mini-umowa',
    category: 'CONTRACTS',
    qualityTier: 'standard',
    version: '1.0',
    expectedStoragePath:
      'masters/contract_simple_order_standard/v1.0/contract_simple_order_standard.docx',
    contentNote:
      'Uproszczone zlecenie na mniejsze prace budowlane lub remontowe. Szybka forma bez rozbudowanych klauzul.',
  },
] as const;

// ── Helper functions ──────────────────────────────────────────────────────────

/** Find inventory entry by template_key. */
export function getInventoryEntry(
  templateKey: string,
): PremiumTemplateInventoryEntry | undefined {
  return PREMIUM_TEMPLATE_INVENTORY.find((e) => e.templateKey === templateKey);
}

/**
 * Return inventory entries that are NOT in the provided set of publish-safe template keys.
 * Used by OwnerDiagnosticPanel to list what still needs to be uploaded / activated.
 *
 * @param publishSafeTemplateKeys - Set of template_key values returned by useModeBMasterTemplates
 *   (i.e. is_active=true + docx_master_path NOT NULL).
 */
export function getPendingInventoryEntries(
  publishSafeTemplateKeys: Set<string>,
): PremiumTemplateInventoryEntry[] {
  return PREMIUM_TEMPLATE_INVENTORY.filter(
    (e) => !publishSafeTemplateKeys.has(e.templateKey),
  );
}
