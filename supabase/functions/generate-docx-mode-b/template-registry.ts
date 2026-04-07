/**
 * template-registry.ts — generate-docx-mode-b Edge Function
 * PR-05a (Mode B Base Contracts)
 *
 * Mapowanie template_key → funkcja generatora.
 * Każdy wpis odpowiada wierszowi w tabeli document_master_templates.
 */

import { Paragraph, Table } from "npm:docx@8.5.0";
import { buildContractFixedPrice }  from "./templates/contract-fixed-price.ts";
import { buildContractCostPlus }    from "./templates/contract-cost-plus.ts";
import { buildContractMaterials }   from "./templates/contract-materials.ts";
import { buildContractAdvance }     from "./templates/contract-advance.ts";
import { buildContractSimple }      from "./templates/contract-simple.ts";
import type { DocxContext } from "./types.ts";

export type TemplateBuilder = (ctx?: DocxContext) => Array<Paragraph | Table>;

/** Rejestr generatorów. template_key musi być identyczny z DB (document_master_templates). */
export const TEMPLATE_REGISTRY: Record<string, TemplateBuilder> = {
  contract_fixed_price_premium:    buildContractFixedPrice,
  contract_cost_plus_standard:     buildContractCostPlus,
  contract_materials_standard:     buildContractMaterials,
  contract_advance_stages_premium: buildContractAdvance,
  contract_simple_short:           buildContractSimple,
};

/** Sprawdza czy template_key jest obsługiwany przez generator. */
export function isKnownTemplateKey(key: string): key is keyof typeof TEMPLATE_REGISTRY {
  return Object.prototype.hasOwnProperty.call(TEMPLATE_REGISTRY, key);
}
