/**
 * modeBContractTemplates.ts -- PR-05a (Master DOCX Contracts)
 *
 * Metadata registry for the 5 contract master DOCX templates.
 * Source of truth for documents = real DOCX files in bucket 'document-masters'.
 * This file provides ONLY display metadata (names, descriptions, mapping).
 *
 * Template keys match document_master_templates.template_key (DB seed).
 * Mode A keys (src/data/documentTemplates.ts) are separate -- no conflict.
 */

export interface ModeBContractMeta {
  /** Matches document_master_templates.template_key */
  templateKey: string;
  /** Human-readable name (Polish) */
  name: string;
  /** Short description for UI */
  description: string;
  /** Mode A equivalent key (for reference only, not used in Mode B flow) */
  modeAKey: string;
  /** Local DOCX file path for admin upload reference */
  localDocxFile: string;
}

/**
 * Registry of 5 contract templates for Mode B (PR-05a).
 *
 * IMPORTANT: These are display metadata only.
 * The actual document content lives in the DOCX files (source of truth).
 * The database records live in document_master_templates (seed migration).
 */
export const MODE_B_CONTRACT_TEMPLATES: readonly ModeBContractMeta[] = [
  {
    templateKey: 'contract_fixed_price_standard',
    name: 'Umowa o roboty budowlane \u2014 rycza\u0142t',
    description: 'Umowa z wynagrodzeniem rycza\u0142towym. Obejmuje pe\u0142ny zakres rob\u00f3t z ustalonym z g\u00f3ry wynagrodzeniem.',
    modeAKey: 'contract_fixed_price',
    localDocxFile: 'contract_fixed_price.docx',
  },
  {
    templateKey: 'contract_cost_plus_standard',
    name: 'Umowa kosztorysowa (koszt + mar\u017ca)',
    description: 'Rozliczenie na podstawie kosztorysu powykonawczego. Wynagrodzenie = udokumentowane koszty + mar\u017ca.',
    modeAKey: 'contract_cost_plus',
    localDocxFile: 'contract_cost_plus.docx',
  },
  {
    templateKey: 'contract_with_materials_standard',
    name: 'Umowa z klauzul\u0105 materia\u0142ow\u0105',
    description: 'Umowa z podzia\u0142em odpowiedzialno\u015bci za materia\u0142y mi\u0119dzy Zamawiaj\u0105cym a Wykonawc\u0105.',
    modeAKey: 'contract_with_materials',
    localDocxFile: 'contract_with_materials.docx',
  },
  {
    templateKey: 'contract_with_advance_standard',
    name: 'Umowa z zaliczk\u0105 i etapami',
    description: 'Umowa z zaliczk\u0105 na pocz\u0105tku i rozliczeniem etapowym. Harmonogram p\u0142atno\u015bci powi\u0105zany z etapami rob\u00f3t.',
    modeAKey: 'contract_with_advance',
    localDocxFile: 'contract_with_advance.docx',
  },
  {
    templateKey: 'contract_simple_order_standard',
    name: 'Zlecenie / mini-umowa',
    description: 'Uproszczone zlecenie na mniejsze prace budowlane lub remontowe. Szybka forma bez rozbudowanych klauzul.',
    modeAKey: 'contract_simple_order',
    localDocxFile: 'contract_simple_order.docx',
  },
] as const;

/**
 * Find Mode B contract metadata by template_key.
 */
export function getModeBContractByKey(
  templateKey: string,
): ModeBContractMeta | undefined {
  return MODE_B_CONTRACT_TEMPLATES.find((t) => t.templateKey === templateKey);
}
