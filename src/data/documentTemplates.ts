/**
 * documentTemplates.ts — PR-17
 *
 * Canonical template definitions (templates-as-code).
 * These are the master definitions; instances (filled forms) live in DB (document_instances table).
 *
 * Source of truth for Compliance/Inspections: /docs/COMPLIANCE/INSPECTIONS_PL.md
 * (see ADR-0010)
 *
 * Categories:
 *   CONTRACTS        — Umowy
 *   PROTOCOLS        — Protokoły
 *   ANNEXES          — Załączniki
 *   COMPLIANCE       — Przeglądy / Compliance (Enterprise)
 *   OTHER            — Inne
 *
 * Autofill sources:
 *   company.*   — from profiles table (PR-05)
 *   client.*    — from clients table (PR-08)
 *   offer.*     — from offers table (PR-10/11)
 *   project.*   — from v2_projects table (PR-13)
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type TemplateCategory =
  | 'CONTRACTS'
  | 'PROTOCOLS'
  | 'ANNEXES'
  | 'COMPLIANCE'
  | 'OTHER';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'date'
  | 'number'
  | 'checkbox'
  | 'select';

export type AutofillSource =
  | 'company.name'
  | 'company.nip'
  | 'company.address'
  | 'company.phone'
  | 'company.email'
  | 'client.name'
  | 'client.address'
  | 'client.phone'
  | 'client.email'
  | 'offer.number'
  | 'offer.total_gross'
  | 'offer.title'
  | 'project.title'
  | 'project.address'
  | 'current.date';

export interface TemplateReference {
  text: string;
  url?: string;
}

export interface TemplateField {
  key: string;
  /** i18n key for label, e.g. "docTemplates.fields.contractorName" */
  labelKey: string;
  type: FieldType;
  required?: boolean;
  autofill?: AutofillSource;
  placeholder?: string;
  options?: string[];   // for 'select' type
  defaultValue?: string;
}

export interface TemplateSection {
  key: string;
  /** i18n key for section title */
  titleKey: string;
  fields: TemplateField[];
}

export type DossierTargetCategory =
  | 'CONTRACT'
  | 'PROTOCOL'
  | 'RECEIPT'
  | 'PHOTO'
  | 'GUARANTEE'
  | 'OTHER';

export interface DocumentTemplate {
  key: string;
  category: TemplateCategory;
  /** i18n key */
  titleKey: string;
  /** i18n key */
  descriptionKey: string;
  version: string;
  /** Legal/standard references — shown in UI and embedded in PDF */
  references: TemplateReference[];
  sections: TemplateSection[];
  /** Which dossier category to use when saving to dossier */
  dossierCategory: DossierTargetCategory;
}

// ── Category metadata ─────────────────────────────────────────────────────────

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  'CONTRACTS',
  'PROTOCOLS',
  'ANNEXES',
  'COMPLIANCE',
  'OTHER',
];

export const TEMPLATE_CATEGORY_TITLE_KEY: Record<TemplateCategory, string> = {
  CONTRACTS:  'docTemplates.category.CONTRACTS',
  PROTOCOLS:  'docTemplates.category.PROTOCOLS',
  ANNEXES:    'docTemplates.category.ANNEXES',
  COMPLIANCE: 'docTemplates.category.COMPLIANCE',
  OTHER:      'docTemplates.category.OTHER',
};

// ── Helper: common field definitions ─────────────────────────────────────────

const FIELD_CONTRACTOR_NAME: TemplateField = {
  key: 'contractor_name',
  labelKey: 'docTemplates.fields.contractorName',
  type: 'text',
  required: true,
  autofill: 'company.name',
};

const FIELD_CONTRACTOR_NIP: TemplateField = {
  key: 'contractor_nip',
  labelKey: 'docTemplates.fields.contractorNip',
  type: 'text',
  autofill: 'company.nip',
};

const FIELD_CONTRACTOR_ADDRESS: TemplateField = {
  key: 'contractor_address',
  labelKey: 'docTemplates.fields.contractorAddress',
  type: 'text',
  autofill: 'company.address',
};

const FIELD_CONTRACTOR_PHONE: TemplateField = {
  key: 'contractor_phone',
  labelKey: 'docTemplates.fields.contractorPhone',
  type: 'text',
  autofill: 'company.phone',
};

const FIELD_CLIENT_NAME: TemplateField = {
  key: 'client_name',
  labelKey: 'docTemplates.fields.clientName',
  type: 'text',
  required: true,
  autofill: 'client.name',
};

const FIELD_CLIENT_ADDRESS: TemplateField = {
  key: 'client_address',
  labelKey: 'docTemplates.fields.clientAddress',
  type: 'text',
  autofill: 'client.address',
};

const FIELD_CLIENT_PHONE: TemplateField = {
  key: 'client_phone',
  labelKey: 'docTemplates.fields.clientPhone',
  type: 'text',
  autofill: 'client.phone',
};

const FIELD_CLIENT_EMAIL: TemplateField = {
  key: 'client_email',
  labelKey: 'docTemplates.fields.clientEmail',
  type: 'text',
  autofill: 'client.email',
};

const FIELD_PROJECT_TITLE: TemplateField = {
  key: 'project_title',
  labelKey: 'docTemplates.fields.projectTitle',
  type: 'text',
  required: true,
  autofill: 'project.title',
};

const FIELD_PROJECT_ADDRESS: TemplateField = {
  key: 'project_address',
  labelKey: 'docTemplates.fields.projectAddress',
  type: 'text',
  autofill: 'project.address',
};

const FIELD_CONTRACT_DATE: TemplateField = {
  key: 'contract_date',
  labelKey: 'docTemplates.fields.contractDate',
  type: 'date',
  required: true,
  autofill: 'current.date',
};

const FIELD_START_DATE: TemplateField = {
  key: 'start_date',
  labelKey: 'docTemplates.fields.startDate',
  type: 'date',
};

const FIELD_END_DATE: TemplateField = {
  key: 'end_date',
  labelKey: 'docTemplates.fields.endDate',
  type: 'date',
};

const FIELD_NET_AMOUNT: TemplateField = {
  key: 'net_amount',
  labelKey: 'docTemplates.fields.netAmount',
  type: 'number',
};

const FIELD_TOTAL_AMOUNT: TemplateField = {
  key: 'total_amount',
  labelKey: 'docTemplates.fields.totalAmount',
  type: 'number',
  autofill: 'offer.total_gross',
};

const FIELD_PAYMENT_TERMS: TemplateField = {
  key: 'payment_terms',
  labelKey: 'docTemplates.fields.paymentTerms',
  type: 'textarea',
};

const FIELD_SCOPE_DESCRIPTION: TemplateField = {
  key: 'scope_description',
  labelKey: 'docTemplates.fields.scopeDescription',
  type: 'textarea',
  required: true,
};

const FIELD_ADDITIONAL_NOTES: TemplateField = {
  key: 'additional_notes',
  labelKey: 'docTemplates.fields.additionalNotes',
  type: 'textarea',
};

const FIELD_INSPECTION_DATE: TemplateField = {
  key: 'inspection_date',
  labelKey: 'docTemplates.fields.inspectionDate',
  type: 'date',
  required: true,
  autofill: 'current.date',
};

const FIELD_NEXT_INSPECTION_DATE: TemplateField = {
  key: 'next_inspection_date',
  labelKey: 'docTemplates.fields.nextInspectionDate',
  type: 'date',
  required: true,
};

const FIELD_INSPECTOR_NAME: TemplateField = {
  key: 'inspector_name',
  labelKey: 'docTemplates.fields.inspectorName',
  type: 'text',
  required: true,
};

const FIELD_INSPECTOR_LICENSE: TemplateField = {
  key: 'inspector_license',
  labelKey: 'docTemplates.fields.inspectorLicense',
  type: 'text',
  required: true,
};

const FIELD_OBJECT_ADDRESS: TemplateField = {
  key: 'object_address',
  labelKey: 'docTemplates.fields.objectAddress',
  type: 'text',
  required: true,
  autofill: 'project.address',
};

const FIELD_OBJECT_TYPE: TemplateField = {
  key: 'object_type',
  labelKey: 'docTemplates.fields.objectType',
  type: 'text',
};

const FIELD_OWNER_NAME: TemplateField = {
  key: 'owner_name',
  labelKey: 'docTemplates.fields.ownerName',
  type: 'text',
  required: true,
  autofill: 'client.name',
};

const FIELD_OWNER_ADDRESS: TemplateField = {
  key: 'owner_address',
  labelKey: 'docTemplates.fields.ownerAddress',
  type: 'text',
  autofill: 'client.address',
};

const FIELD_FINDINGS: TemplateField = {
  key: 'findings',
  labelKey: 'docTemplates.fields.findings',
  type: 'textarea',
  required: true,
};

const FIELD_RISK_RATING: TemplateField = {
  key: 'risk_rating',
  labelKey: 'docTemplates.fields.riskRating',
  type: 'select',
  options: ['low', 'medium', 'high', 'critical'],
};

const FIELD_RECOMMENDED_ACTIONS: TemplateField = {
  key: 'recommended_actions',
  labelKey: 'docTemplates.fields.recommendedActions',
  type: 'textarea',
};

const FIELD_ATTACHMENTS_DESC: TemplateField = {
  key: 'attachments_desc',
  labelKey: 'docTemplates.fields.attachmentsDesc',
  type: 'textarea',
};

// ── Common sections ───────────────────────────────────────────────────────────

const SECTION_PARTIES = (fields: TemplateField[]): TemplateSection => ({
  key: 'parties',
  titleKey: 'docTemplates.section.parties',
  fields,
});

const SECTION_WORK_SCOPE: TemplateSection = {
  key: 'scope',
  titleKey: 'docTemplates.section.scope',
  fields: [FIELD_PROJECT_TITLE, FIELD_PROJECT_ADDRESS, FIELD_SCOPE_DESCRIPTION],
};

const SECTION_FINANCIAL = (fields: TemplateField[]): TemplateSection => ({
  key: 'financial',
  titleKey: 'docTemplates.section.financial',
  fields,
});

const SECTION_TIMELINE: TemplateSection = {
  key: 'timeline',
  titleKey: 'docTemplates.section.timeline',
  fields: [FIELD_CONTRACT_DATE, FIELD_START_DATE, FIELD_END_DATE],
};

const SECTION_CONDITIONS: TemplateSection = {
  key: 'conditions',
  titleKey: 'docTemplates.section.conditions',
  fields: [FIELD_PAYMENT_TERMS, FIELD_ADDITIONAL_NOTES],
};

const SECTION_OBJECT_DATA: TemplateSection = {
  key: 'objectData',
  titleKey: 'docTemplates.section.objectData',
  fields: [FIELD_OBJECT_ADDRESS, FIELD_OBJECT_TYPE],
};

const SECTION_INSPECTION_PARTIES: TemplateSection = {
  key: 'inspectionParties',
  titleKey: 'docTemplates.section.inspectionParties',
  fields: [FIELD_OWNER_NAME, FIELD_OWNER_ADDRESS, FIELD_INSPECTOR_NAME, FIELD_INSPECTOR_LICENSE],
};

const SECTION_FINDINGS: TemplateSection = {
  key: 'findings',
  titleKey: 'docTemplates.section.findings',
  fields: [FIELD_FINDINGS, FIELD_RISK_RATING, FIELD_RECOMMENDED_ACTIONS],
};

const SECTION_DATES_SIGN: TemplateSection = {
  key: 'datesSign',
  titleKey: 'docTemplates.section.datesSign',
  fields: [FIELD_INSPECTION_DATE, FIELD_NEXT_INSPECTION_DATE, FIELD_ATTACHMENTS_DESC],
};

// ── A) CONTRACTS ──────────────────────────────────────────────────────────────

const CONTRACT_FIXED_PRICE: DocumentTemplate = {
  key: 'contract_fixed_price',
  category: 'CONTRACTS',
  titleKey: 'docTemplates.contracts.fixedPrice.title',
  descriptionKey: 'docTemplates.contracts.fixedPrice.desc',
  version: '1.0',
  references: [
    { text: 'Kodeks cywilny, art. 627–646 (umowa o dzieło), Dz.U. 1964 nr 16 poz. 93 ze zm.' },
    { text: 'Kodeks cywilny, art. 647–658 (umowa o roboty budowlane), Dz.U. 1964 nr 16 poz. 93 ze zm.' },
  ],
  dossierCategory: 'CONTRACT',
  sections: [
    SECTION_PARTIES([
      FIELD_CONTRACTOR_NAME, FIELD_CONTRACTOR_NIP, FIELD_CONTRACTOR_ADDRESS, FIELD_CONTRACTOR_PHONE,
      FIELD_CLIENT_NAME, FIELD_CLIENT_ADDRESS, FIELD_CLIENT_PHONE, FIELD_CLIENT_EMAIL,
    ]),
    SECTION_WORK_SCOPE,
    SECTION_FINANCIAL([
      FIELD_TOTAL_AMOUNT,
      {
        key: 'vat_info',
        labelKey: 'docTemplates.fields.vatInfo',
        type: 'text',
        defaultValue: 'VAT zwolniony (art. 43 ust. 1 ustawy o VAT)',
      },
    ]),
    SECTION_TIMELINE,
    SECTION_CONDITIONS,
  ],
};

const CONTRACT_COST_PLUS: DocumentTemplate = {
  key: 'contract_cost_plus',
  category: 'CONTRACTS',
  titleKey: 'docTemplates.contracts.costPlus.title',
  descriptionKey: 'docTemplates.contracts.costPlus.desc',
  version: '1.0',
  references: [
    { text: 'Kodeks cywilny, art. 627–646 (umowa o dzieło), Dz.U. 1964 nr 16 poz. 93 ze zm.' },
    { text: 'Kodeks cywilny, art. 647–658 (umowa o roboty budowlane), Dz.U. 1964 nr 16 poz. 93 ze zm.' },
  ],
  dossierCategory: 'CONTRACT',
  sections: [
    SECTION_PARTIES([
      FIELD_CONTRACTOR_NAME, FIELD_CONTRACTOR_NIP, FIELD_CONTRACTOR_ADDRESS,
      FIELD_CLIENT_NAME, FIELD_CLIENT_ADDRESS,
    ]),
    SECTION_WORK_SCOPE,
    SECTION_FINANCIAL([
      FIELD_NET_AMOUNT,
      {
        key: 'margin_rate',
        labelKey: 'docTemplates.fields.marginRate',
        type: 'text',
        placeholder: 'np. 15%',
      },
      {
        key: 'billing_cycle',
        labelKey: 'docTemplates.fields.billingCycle',
        type: 'text',
        defaultValue: 'miesięcznie na podstawie kosztorysu powykonawczego',
      },
    ]),
    SECTION_TIMELINE,
    SECTION_CONDITIONS,
  ],
};

const CONTRACT_WITH_MATERIALS: DocumentTemplate = {
  key: 'contract_with_materials',
  category: 'CONTRACTS',
  titleKey: 'docTemplates.contracts.withMaterials.title',
  descriptionKey: 'docTemplates.contracts.withMaterials.desc',
  version: '1.0',
  references: [
    { text: 'Kodeks cywilny, art. 627–646 (umowa o dzieło), Dz.U. 1964 nr 16 poz. 93 ze zm.' },
  ],
  dossierCategory: 'CONTRACT',
  sections: [
    SECTION_PARTIES([
      FIELD_CONTRACTOR_NAME, FIELD_CONTRACTOR_NIP, FIELD_CONTRACTOR_ADDRESS,
      FIELD_CLIENT_NAME, FIELD_CLIENT_ADDRESS,
    ]),
    SECTION_WORK_SCOPE,
    {
      key: 'materials',
      titleKey: 'docTemplates.section.materials',
      fields: [
        {
          key: 'materials_source',
          labelKey: 'docTemplates.fields.materialsSource',
          type: 'select',
          options: ['contractor', 'client', 'mixed'],
          required: true,
        },
        {
          key: 'materials_desc',
          labelKey: 'docTemplates.fields.materialsDesc',
          type: 'textarea',
        },
        {
          key: 'materials_delivery',
          labelKey: 'docTemplates.fields.materialsDelivery',
          type: 'textarea',
          placeholder: 'Odpowiedzialność za dostawę, ryzyko uszkodzenia...',
        },
      ],
    },
    SECTION_FINANCIAL([FIELD_TOTAL_AMOUNT]),
    SECTION_TIMELINE,
    SECTION_CONDITIONS,
  ],
};

const CONTRACT_WITH_ADVANCE: DocumentTemplate = {
  key: 'contract_with_advance',
  category: 'CONTRACTS',
  titleKey: 'docTemplates.contracts.withAdvance.title',
  descriptionKey: 'docTemplates.contracts.withAdvance.desc',
  version: '1.0',
  references: [
    { text: 'Kodeks cywilny, art. 627–646 (umowa o dzieło), Dz.U. 1964 nr 16 poz. 93 ze zm.' },
    { text: 'Kodeks cywilny, art. 394 (zadatek/zaliczka), Dz.U. 1964 nr 16 poz. 93 ze zm.' },
  ],
  dossierCategory: 'CONTRACT',
  sections: [
    SECTION_PARTIES([
      FIELD_CONTRACTOR_NAME, FIELD_CONTRACTOR_NIP, FIELD_CONTRACTOR_ADDRESS,
      FIELD_CLIENT_NAME, FIELD_CLIENT_ADDRESS,
    ]),
    SECTION_WORK_SCOPE,
    {
      key: 'milestones',
      titleKey: 'docTemplates.section.milestones',
      fields: [
        {
          key: 'milestones_desc',
          labelKey: 'docTemplates.fields.milestonesDesc',
          type: 'textarea',
          required: true,
          placeholder: 'Etap 1: ... — kwota: ...\nEtap 2: ... — kwota: ...',
        },
      ],
    },
    SECTION_FINANCIAL([
      FIELD_TOTAL_AMOUNT,
      {
        key: 'advance_amount',
        labelKey: 'docTemplates.fields.advanceAmount',
        type: 'number',
      },
      {
        key: 'advance_due_date',
        labelKey: 'docTemplates.fields.advanceDueDate',
        type: 'date',
      },
    ]),
    SECTION_TIMELINE,
    SECTION_CONDITIONS,
  ],
};

const CONTRACT_SIMPLE_ORDER: DocumentTemplate = {
  key: 'contract_simple_order',
  category: 'CONTRACTS',
  titleKey: 'docTemplates.contracts.simpleOrder.title',
  descriptionKey: 'docTemplates.contracts.simpleOrder.desc',
  version: '1.0',
  references: [
    { text: 'Kodeks cywilny, art. 627–646 (umowa o dzieło), Dz.U. 1964 nr 16 poz. 93 ze zm.' },
  ],
  dossierCategory: 'CONTRACT',
  sections: [
    SECTION_PARTIES([
      FIELD_CONTRACTOR_NAME, FIELD_CONTRACTOR_PHONE,
      FIELD_CLIENT_NAME, FIELD_CLIENT_ADDRESS, FIELD_CLIENT_PHONE,
    ]),
    {
      key: 'orderDetails',
      titleKey: 'docTemplates.section.orderDetails',
      fields: [
        FIELD_PROJECT_ADDRESS,
        FIELD_SCOPE_DESCRIPTION,
        FIELD_TOTAL_AMOUNT,
        FIELD_START_DATE,
        FIELD_END_DATE,
        FIELD_ADDITIONAL_NOTES,
      ],
    },
  ],
};

// ── B) PROTOCOLS ──────────────────────────────────────────────────────────────

const PROTOCOL_FINAL_ACCEPTANCE: DocumentTemplate = {
  key: 'protocol_final_acceptance',
  category: 'PROTOCOLS',
  titleKey: 'docTemplates.protocols.finalAcceptance.title',
  descriptionKey: 'docTemplates.protocols.finalAcceptance.desc',
  version: '1.0',
  references: [
    { text: 'Kodeks cywilny, art. 647–658 (umowa o roboty budowlane), Dz.U. 1964 nr 16 poz. 93 ze zm.' },
    { text: 'Ustawa Prawo budowlane, art. 57 (oddanie obiektu do użytkowania), Dz.U. 1994 nr 89 poz. 414 ze zm.' },
  ],
  dossierCategory: 'PROTOCOL',
  sections: [
    SECTION_PARTIES([
      FIELD_CONTRACTOR_NAME, FIELD_CONTRACTOR_PHONE,
      FIELD_CLIENT_NAME, FIELD_CLIENT_ADDRESS,
    ]),
    {
      key: 'workDetails',
      titleKey: 'docTemplates.section.workDetails',
      fields: [
        FIELD_PROJECT_TITLE, FIELD_PROJECT_ADDRESS, FIELD_SCOPE_DESCRIPTION,
      ],
    },
    {
      key: 'acceptance',
      titleKey: 'docTemplates.section.acceptance',
      fields: [
        {
          key: 'acceptance_date',
          labelKey: 'docTemplates.fields.acceptanceDate',
          type: 'date',
          required: true,
          autofill: 'current.date',
        },
        {
          key: 'defects_list',
          labelKey: 'docTemplates.fields.defectsList',
          type: 'textarea',
          placeholder: 'Wpisz stwierdzone usterki lub "brak usterek"',
        },
        {
          key: 'defects_deadline',
          labelKey: 'docTemplates.fields.defectsDeadline',
          type: 'date',
        },
        {
          key: 'acceptance_result',
          labelKey: 'docTemplates.fields.acceptanceResult',
          type: 'select',
          options: ['accepted', 'accepted_with_defects', 'rejected'],
          required: true,
        },
        {
          key: 'warranty_period_months',
          labelKey: 'docTemplates.fields.warrantyPeriodMonths',
          type: 'number',
          defaultValue: '24',
        },
      ],
    },
    SECTION_CONDITIONS,
  ],
};

const PROTOCOL_PARTIAL_ACCEPTANCE: DocumentTemplate = {
  key: 'protocol_partial_acceptance',
  category: 'PROTOCOLS',
  titleKey: 'docTemplates.protocols.partialAcceptance.title',
  descriptionKey: 'docTemplates.protocols.partialAcceptance.desc',
  version: '1.0',
  references: [
    { text: 'Kodeks cywilny, art. 647–658 (umowa o roboty budowlane), Dz.U. 1964 nr 16 poz. 93 ze zm.' },
  ],
  dossierCategory: 'PROTOCOL',
  sections: [
    SECTION_PARTIES([
      FIELD_CONTRACTOR_NAME, FIELD_CLIENT_NAME,
    ]),
    {
      key: 'stageDetails',
      titleKey: 'docTemplates.section.stageDetails',
      fields: [
        FIELD_PROJECT_TITLE, FIELD_PROJECT_ADDRESS,
        {
          key: 'stage_name',
          labelKey: 'docTemplates.fields.stageName',
          type: 'text',
          required: true,
          placeholder: 'np. Etap 1 — prace fundamentowe',
        },
        FIELD_SCOPE_DESCRIPTION,
        {
          key: 'stage_amount',
          labelKey: 'docTemplates.fields.stageAmount',
          type: 'number',
        },
        {
          key: 'acceptance_date',
          labelKey: 'docTemplates.fields.acceptanceDate',
          type: 'date',
          required: true,
          autofill: 'current.date',
        },
        {
          key: 'defects_list',
          labelKey: 'docTemplates.fields.defectsList',
          type: 'textarea',
        },
        {
          key: 'acceptance_result',
          labelKey: 'docTemplates.fields.acceptanceResult',
          type: 'select',
          options: ['accepted', 'accepted_with_defects', 'rejected'],
          required: true,
        },
      ],
    },
  ],
};

const PROTOCOL_SITE_HANDOVER: DocumentTemplate = {
  key: 'protocol_site_handover',
  category: 'PROTOCOLS',
  titleKey: 'docTemplates.protocols.siteHandover.title',
  descriptionKey: 'docTemplates.protocols.siteHandover.desc',
  version: '1.0',
  references: [
    { text: 'Kodeks cywilny, art. 647 (przekazanie placu budowy), Dz.U. 1964 nr 16 poz. 93 ze zm.' },
  ],
  dossierCategory: 'PROTOCOL',
  sections: [
    SECTION_PARTIES([
      FIELD_CONTRACTOR_NAME, FIELD_CLIENT_NAME, FIELD_CLIENT_ADDRESS,
    ]),
    {
      key: 'siteData',
      titleKey: 'docTemplates.section.siteData',
      fields: [
        FIELD_PROJECT_ADDRESS,
        {
          key: 'handover_date',
          labelKey: 'docTemplates.fields.handoverDate',
          type: 'date',
          required: true,
          autofill: 'current.date',
        },
        {
          key: 'keys_count',
          labelKey: 'docTemplates.fields.keysCount',
          type: 'number',
          defaultValue: '1',
        },
        {
          key: 'meter_electricity',
          labelKey: 'docTemplates.fields.meterElectricity',
          type: 'text',
          placeholder: 'Stan licznika prądu przy przekazaniu',
        },
        {
          key: 'meter_water',
          labelKey: 'docTemplates.fields.meterWater',
          type: 'text',
          placeholder: 'Stan wodomierza przy przekazaniu',
        },
        {
          key: 'site_condition',
          labelKey: 'docTemplates.fields.siteCondition',
          type: 'textarea',
          placeholder: 'Opis stanu lokalu/placu w chwili przekazania',
        },
        {
          key: 'access_restrictions',
          labelKey: 'docTemplates.fields.accessRestrictions',
          type: 'textarea',
          placeholder: 'Godziny dostępu, ograniczenia, sąsiedzi...',
        },
      ],
    },
    SECTION_CONDITIONS,
  ],
};

const PROTOCOL_DEFECT_REPORT: DocumentTemplate = {
  key: 'protocol_defect_report',
  category: 'PROTOCOLS',
  titleKey: 'docTemplates.protocols.defectReport.title',
  descriptionKey: 'docTemplates.protocols.defectReport.desc',
  version: '1.0',
  references: [
    { text: 'Kodeks cywilny, art. 637 (rękojmia za wady dzieła), Dz.U. 1964 nr 16 poz. 93 ze zm.' },
  ],
  dossierCategory: 'PROTOCOL',
  sections: [
    SECTION_PARTIES([FIELD_CONTRACTOR_NAME, FIELD_CLIENT_NAME, FIELD_CLIENT_PHONE]),
    {
      key: 'defectDetails',
      titleKey: 'docTemplates.section.defectDetails',
      fields: [
        FIELD_PROJECT_TITLE, FIELD_PROJECT_ADDRESS,
        {
          key: 'defect_date',
          labelKey: 'docTemplates.fields.defectDate',
          type: 'date',
          required: true,
          autofill: 'current.date',
        },
        {
          key: 'defect_description',
          labelKey: 'docTemplates.fields.defectDescription',
          type: 'textarea',
          required: true,
          placeholder: 'Szczegółowy opis usterki/awarii',
        },
        {
          key: 'urgency',
          labelKey: 'docTemplates.fields.urgency',
          type: 'select',
          options: ['low', 'medium', 'high', 'emergency'],
          required: true,
        },
        {
          key: 'immediate_actions',
          labelKey: 'docTemplates.fields.immediateActions',
          type: 'textarea',
          placeholder: 'Działania doraźne podjęte natychmiast',
        },
        {
          key: 'repair_deadline',
          labelKey: 'docTemplates.fields.repairDeadline',
          type: 'date',
        },
        {
          key: 'photos_attached',
          labelKey: 'docTemplates.fields.photosAttached',
          type: 'text',
          placeholder: 'Liczba i opis zdjęć',
        },
      ],
    },
    SECTION_CONDITIONS,
  ],
};

const PROTOCOL_NECESSITY_CHANGE: DocumentTemplate = {
  key: 'protocol_necessity_change',
  category: 'PROTOCOLS',
  titleKey: 'docTemplates.protocols.necessityChange.title',
  descriptionKey: 'docTemplates.protocols.necessityChange.desc',
  version: '1.0',
  references: [
    { text: 'Kodeks cywilny, art. 630 (zmiana zakresu), Dz.U. 1964 nr 16 poz. 93 ze zm.' },
  ],
  dossierCategory: 'PROTOCOL',
  sections: [
    SECTION_PARTIES([FIELD_CONTRACTOR_NAME, FIELD_CLIENT_NAME]),
    {
      key: 'changeDetails',
      titleKey: 'docTemplates.section.changeDetails',
      fields: [
        FIELD_PROJECT_TITLE, FIELD_PROJECT_ADDRESS,
        {
          key: 'change_date',
          labelKey: 'docTemplates.fields.changeDate',
          type: 'date',
          required: true,
          autofill: 'current.date',
        },
        {
          key: 'change_reason',
          labelKey: 'docTemplates.fields.changeReason',
          type: 'textarea',
          required: true,
          placeholder: 'Przyczyna konieczności zmiany zakresu',
        },
        {
          key: 'original_scope',
          labelKey: 'docTemplates.fields.originalScope',
          type: 'textarea',
          placeholder: 'Zakres pierwotny (z umowy)',
        },
        {
          key: 'new_scope',
          labelKey: 'docTemplates.fields.newScope',
          type: 'textarea',
          required: true,
          placeholder: 'Zakres po zmianie',
        },
        {
          key: 'time_impact',
          labelKey: 'docTemplates.fields.timeImpact',
          type: 'text',
          placeholder: 'np. +7 dni roboczych',
        },
        {
          key: 'cost_impact',
          labelKey: 'docTemplates.fields.costImpact',
          type: 'text',
          placeholder: 'np. +2000 PLN netto',
        },
      ],
    },
  ],
};

const PROTOCOL_KEY_HANDOVER: DocumentTemplate = {
  key: 'protocol_key_handover',
  category: 'PROTOCOLS',
  titleKey: 'docTemplates.protocols.keyHandover.title',
  descriptionKey: 'docTemplates.protocols.keyHandover.desc',
  version: '1.0',
  references: [],
  dossierCategory: 'PROTOCOL',
  sections: [
    SECTION_PARTIES([FIELD_CONTRACTOR_NAME, FIELD_CLIENT_NAME, FIELD_CLIENT_PHONE]),
    {
      key: 'keyData',
      titleKey: 'docTemplates.section.keyData',
      fields: [
        FIELD_PROJECT_ADDRESS,
        {
          key: 'handover_date',
          labelKey: 'docTemplates.fields.handoverDate',
          type: 'date',
          required: true,
          autofill: 'current.date',
        },
        {
          key: 'keys_count',
          labelKey: 'docTemplates.fields.keysCount',
          type: 'number',
          required: true,
          defaultValue: '1',
        },
        {
          key: 'key_types',
          labelKey: 'docTemplates.fields.keyTypes',
          type: 'text',
          placeholder: 'np. klucz do wejścia + 2x do pokoju',
        },
        {
          key: 'handover_direction',
          labelKey: 'docTemplates.fields.handoverDirection',
          type: 'select',
          options: ['contractor_to_client', 'client_to_contractor'],
          required: true,
        },
      ],
    },
  ],
};

const PROTOCOL_WARRANTY_INSPECTION: DocumentTemplate = {
  key: 'protocol_warranty_inspection',
  category: 'PROTOCOLS',
  titleKey: 'docTemplates.protocols.warrantyInspection.title',
  descriptionKey: 'docTemplates.protocols.warrantyInspection.desc',
  version: '1.0',
  references: [
    { text: 'Kodeks cywilny, art. 638 (rękojmia za wady), Dz.U. 1964 nr 16 poz. 93 ze zm.' },
  ],
  dossierCategory: 'PROTOCOL',
  sections: [
    SECTION_PARTIES([FIELD_CONTRACTOR_NAME, FIELD_CLIENT_NAME]),
    {
      key: 'warrantyData',
      titleKey: 'docTemplates.section.warrantyData',
      fields: [
        FIELD_PROJECT_TITLE, FIELD_PROJECT_ADDRESS,
        {
          key: 'inspection_date',
          labelKey: 'docTemplates.fields.inspectionDate',
          type: 'date',
          required: true,
          autofill: 'current.date',
        },
        {
          key: 'warranty_end_date',
          labelKey: 'docTemplates.fields.warrantyEndDate',
          type: 'date',
        },
        {
          key: 'issues_found',
          labelKey: 'docTemplates.fields.issuesFound',
          type: 'textarea',
          placeholder: 'Lista stwierdzonych usterek lub "brak usterek"',
        },
        {
          key: 'repair_deadline',
          labelKey: 'docTemplates.fields.repairDeadline',
          type: 'date',
        },
      ],
    },
    SECTION_CONDITIONS,
  ],
};

const PROTOCOL_HIDDEN_WORKS: DocumentTemplate = {
  key: 'protocol_hidden_works',
  category: 'PROTOCOLS',
  titleKey: 'docTemplates.protocols.hiddenWorks.title',
  descriptionKey: 'docTemplates.protocols.hiddenWorks.desc',
  version: '1.0',
  references: [
    { text: 'Ustawa Prawo budowlane — roboty ulegające zakryciu (art. 22 pkt 7), Dz.U. 1994 nr 89 poz. 414 ze zm.' },
  ],
  dossierCategory: 'PROTOCOL',
  sections: [
    SECTION_PARTIES([FIELD_CONTRACTOR_NAME, FIELD_CLIENT_NAME]),
    {
      key: 'hiddenWorksData',
      titleKey: 'docTemplates.section.hiddenWorksData',
      fields: [
        FIELD_PROJECT_TITLE, FIELD_PROJECT_ADDRESS,
        {
          key: 'works_description',
          labelKey: 'docTemplates.fields.worksDescription',
          type: 'textarea',
          required: true,
          placeholder: 'Opis robót ulegających zakryciu (np. zbrojenie, instalacje podposadzkowe)',
        },
        {
          key: 'inspection_date',
          labelKey: 'docTemplates.fields.inspectionDate',
          type: 'date',
          required: true,
          autofill: 'current.date',
        },
        {
          key: 'compliance_confirmed',
          labelKey: 'docTemplates.fields.complianceConfirmed',
          type: 'checkbox',
        },
        FIELD_ADDITIONAL_NOTES,
        FIELD_ATTACHMENTS_DESC,
      ],
    },
  ],
};

const PROTOCOL_DAMAGE: DocumentTemplate = {
  key: 'protocol_damage',
  category: 'PROTOCOLS',
  titleKey: 'docTemplates.protocols.damage.title',
  descriptionKey: 'docTemplates.protocols.damage.desc',
  version: '1.0',
  references: [
    { text: 'Kodeks cywilny, art. 415 (czyny niedozwolone), Dz.U. 1964 nr 16 poz. 93 ze zm.' },
  ],
  dossierCategory: 'PROTOCOL',
  sections: [
    SECTION_PARTIES([FIELD_CONTRACTOR_NAME, FIELD_CLIENT_NAME, FIELD_CLIENT_PHONE]),
    {
      key: 'damageData',
      titleKey: 'docTemplates.section.damageData',
      fields: [
        FIELD_PROJECT_ADDRESS,
        {
          key: 'damage_date',
          labelKey: 'docTemplates.fields.damageDate',
          type: 'date',
          required: true,
          autofill: 'current.date',
        },
        {
          key: 'damage_type',
          labelKey: 'docTemplates.fields.damageType',
          type: 'select',
          options: ['flood', 'fire', 'mechanical', 'other'],
          required: true,
        },
        {
          key: 'damage_description',
          labelKey: 'docTemplates.fields.damageDescription',
          type: 'textarea',
          required: true,
        },
        {
          key: 'estimated_damage',
          labelKey: 'docTemplates.fields.estimatedDamage',
          type: 'text',
          placeholder: 'Szacowana wartość szkody w PLN',
        },
        {
          key: 'immediate_actions',
          labelKey: 'docTemplates.fields.immediateActions',
          type: 'textarea',
        },
        FIELD_ATTACHMENTS_DESC,
      ],
    },
  ],
};

// ── C) ANNEXES ────────────────────────────────────────────────────────────────

const ANNEX_CONTRACT_CHANGE: DocumentTemplate = {
  key: 'annex_contract_change',
  category: 'ANNEXES',
  titleKey: 'docTemplates.annexes.contractChange.title',
  descriptionKey: 'docTemplates.annexes.contractChange.desc',
  version: '1.0',
  references: [
    { text: 'Kodeks cywilny — zmiana umowy za zgodą stron, Dz.U. 1964 nr 16 poz. 93 ze zm.' },
  ],
  dossierCategory: 'CONTRACT',
  sections: [
    SECTION_PARTIES([FIELD_CONTRACTOR_NAME, FIELD_CLIENT_NAME]),
    {
      key: 'annexDetails',
      titleKey: 'docTemplates.section.annexDetails',
      fields: [
        {
          key: 'base_contract_date',
          labelKey: 'docTemplates.fields.baseContractDate',
          type: 'date',
          required: true,
        },
        FIELD_PROJECT_TITLE,
        {
          key: 'annex_number',
          labelKey: 'docTemplates.fields.annexNumber',
          type: 'text',
          placeholder: 'np. Aneks nr 1',
        },
        {
          key: 'change_date',
          labelKey: 'docTemplates.fields.changeDate',
          type: 'date',
          required: true,
          autofill: 'current.date',
        },
        {
          key: 'changes_description',
          labelKey: 'docTemplates.fields.changesDescription',
          type: 'textarea',
          required: true,
          placeholder: 'Opis zmian: termin / koszt / zakres / inne',
        },
        {
          key: 'new_completion_date',
          labelKey: 'docTemplates.fields.newCompletionDate',
          type: 'date',
        },
        {
          key: 'new_total_amount',
          labelKey: 'docTemplates.fields.newTotalAmount',
          type: 'number',
        },
      ],
    },
  ],
};

const ANNEX_COST_ESTIMATE: DocumentTemplate = {
  key: 'annex_cost_estimate',
  category: 'ANNEXES',
  titleKey: 'docTemplates.annexes.costEstimate.title',
  descriptionKey: 'docTemplates.annexes.costEstimate.desc',
  version: '1.0',
  references: [],
  dossierCategory: 'CONTRACT',
  sections: [
    SECTION_PARTIES([FIELD_CONTRACTOR_NAME, FIELD_CLIENT_NAME]),
    {
      key: 'estimateData',
      titleKey: 'docTemplates.section.estimateData',
      fields: [
        FIELD_PROJECT_TITLE, FIELD_PROJECT_ADDRESS,
        {
          key: 'estimate_date',
          labelKey: 'docTemplates.fields.estimateDate',
          type: 'date',
          required: true,
          autofill: 'current.date',
        },
        {
          key: 'items_list',
          labelKey: 'docTemplates.fields.itemsList',
          type: 'textarea',
          required: true,
          placeholder: 'Pozycja 1: ... — ilość: ... — j.m.: ... — cena: ...\nPozycja 2: ...',
        },
        FIELD_NET_AMOUNT,
        FIELD_TOTAL_AMOUNT,
      ],
    },
  ],
};

const ANNEX_MILESTONE_SCHEDULE: DocumentTemplate = {
  key: 'annex_milestone_schedule',
  category: 'ANNEXES',
  titleKey: 'docTemplates.annexes.milestoneSchedule.title',
  descriptionKey: 'docTemplates.annexes.milestoneSchedule.desc',
  version: '1.0',
  references: [],
  dossierCategory: 'CONTRACT',
  sections: [
    SECTION_PARTIES([FIELD_CONTRACTOR_NAME, FIELD_CLIENT_NAME]),
    {
      key: 'scheduleData',
      titleKey: 'docTemplates.section.scheduleData',
      fields: [
        FIELD_PROJECT_TITLE,
        {
          key: 'schedule_table',
          labelKey: 'docTemplates.fields.scheduleTable',
          type: 'textarea',
          required: true,
          placeholder: 'Etap 1: [opis] — termin: [data] — płatność: [kwota]\nEtap 2: ...',
        },
        FIELD_TOTAL_AMOUNT,
      ],
    },
  ],
};

const ANNEX_MATERIALS_CARD: DocumentTemplate = {
  key: 'annex_materials_card',
  category: 'ANNEXES',
  titleKey: 'docTemplates.annexes.materialsCard.title',
  descriptionKey: 'docTemplates.annexes.materialsCard.desc',
  version: '1.0',
  references: [],
  dossierCategory: 'OTHER',
  sections: [
    {
      key: 'materialsData',
      titleKey: 'docTemplates.section.materialsData',
      fields: [
        FIELD_PROJECT_TITLE, FIELD_PROJECT_ADDRESS,
        {
          key: 'materials_list',
          labelKey: 'docTemplates.fields.materialsList',
          type: 'textarea',
          required: true,
          placeholder: 'Materiał 1: [nazwa] — ilość: ... — j.m.: ... — producent: ...\nMateriał 2: ...',
        },
        FIELD_ADDITIONAL_NOTES,
      ],
    },
  ],
};

const ANNEX_HSE_CHECKLIST: DocumentTemplate = {
  key: 'annex_hse_checklist',
  category: 'ANNEXES',
  titleKey: 'docTemplates.annexes.hseChecklist.title',
  descriptionKey: 'docTemplates.annexes.hseChecklist.desc',
  version: '1.0',
  references: [
    { text: 'Kodeks pracy — przepisy BHP, Dz.U. 1974 nr 24 poz. 141 ze zm.' },
    { text: 'Rozporządzenie MINiPB z 28.03.2011 r. w sprawie BHP przy robotach budowlanych (Dz.U. 2011 nr 80 poz. 437).' },
  ],
  dossierCategory: 'OTHER',
  sections: [
    SECTION_PARTIES([FIELD_CONTRACTOR_NAME, FIELD_CLIENT_NAME]),
    {
      key: 'hseData',
      titleKey: 'docTemplates.section.hseData',
      fields: [
        FIELD_PROJECT_ADDRESS,
        {
          key: 'hse_date',
          labelKey: 'docTemplates.fields.hseDate',
          type: 'date',
          required: true,
          autofill: 'current.date',
        },
        {
          key: 'ppe_provided',
          labelKey: 'docTemplates.fields.ppeProvided',
          type: 'textarea',
          placeholder: 'Dostarczone środki ochrony indywidualnej: hełm, rękawice, okulary...',
        },
        {
          key: 'property_protection',
          labelKey: 'docTemplates.fields.propertyProtection',
          type: 'textarea',
          placeholder: 'Zabezpieczenie mieszkania: podłogi, meble, drzwi...',
        },
        {
          key: 'emergency_contacts',
          labelKey: 'docTemplates.fields.emergencyContacts',
          type: 'textarea',
          placeholder: 'Numery alarmowe, osoba kontaktowa na budowie',
        },
        {
          key: 'waste_disposal',
          labelKey: 'docTemplates.fields.wasteDisposal',
          type: 'textarea',
          placeholder: 'Sposób wywozu gruzu i odpadów',
        },
      ],
    },
  ],
};

const ANNEX_CLIENT_STATEMENT: DocumentTemplate = {
  key: 'annex_client_statement',
  category: 'ANNEXES',
  titleKey: 'docTemplates.annexes.clientStatement.title',
  descriptionKey: 'docTemplates.annexes.clientStatement.desc',
  version: '1.0',
  references: [
    { text: 'Ustawa Prawo budowlane, art. 32 ust. 4 pkt 2 (prawo do dysponowania nieruchomością), Dz.U. 1994 nr 89 poz. 414 ze zm.' },
  ],
  dossierCategory: 'CONTRACT',
  sections: [
    {
      key: 'statementData',
      titleKey: 'docTemplates.section.statementData',
      fields: [
        FIELD_CLIENT_NAME, FIELD_CLIENT_ADDRESS,
        FIELD_PROJECT_ADDRESS,
        {
          key: 'legal_title',
          labelKey: 'docTemplates.fields.legalTitle',
          type: 'select',
          options: ['owner', 'tenant', 'co_owner', 'attorney'],
          required: true,
        },
        {
          key: 'consents',
          labelKey: 'docTemplates.fields.consents',
          type: 'textarea',
          placeholder: 'Udzielone zgody: sąsiedzi, wspólnota, inne...',
        },
        {
          key: 'statement_date',
          labelKey: 'docTemplates.fields.statementDate',
          type: 'date',
          required: true,
          autofill: 'current.date',
        },
      ],
    },
  ],
};

// ── D) COMPLIANCE / INSPECTIONS ───────────────────────────────────────────────
// Source of truth: /docs/COMPLIANCE/INSPECTIONS_PL.md

const COMPLIANCE_ANNUAL_BUILDING: DocumentTemplate = {
  key: 'compliance_annual_building',
  category: 'COMPLIANCE',
  titleKey: 'docTemplates.compliance.annualBuilding.title',
  descriptionKey: 'docTemplates.compliance.annualBuilding.desc',
  version: '1.0',
  references: [
    {
      text: 'Ustawa Prawo budowlane, art. 62 ust. 1 pkt 1 (przegląd roczny), Dz.U. 1994 nr 89 poz. 414 ze zm.',
      url: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19940890414',
    },
  ],
  dossierCategory: 'OTHER',
  sections: [
    SECTION_OBJECT_DATA,
    SECTION_INSPECTION_PARTIES,
    {
      key: 'inspectionScope',
      titleKey: 'docTemplates.section.inspectionScope',
      fields: [
        {
          key: 'roof_condition',
          labelKey: 'docTemplates.fields.roofCondition',
          type: 'textarea',
          placeholder: 'Stan dachu, obróbki blacharskie, rynny...',
        },
        {
          key: 'facade_condition',
          labelKey: 'docTemplates.fields.facadeCondition',
          type: 'textarea',
          placeholder: 'Stan elewacji, balkony, tarasy...',
        },
        {
          key: 'chimney_condition',
          labelKey: 'docTemplates.fields.chimneyCondition',
          type: 'textarea',
          placeholder: 'Stan kominów, wywiewek, drożność wentylacji...',
        },
        {
          key: 'windows_doors_condition',
          labelKey: 'docTemplates.fields.windowsDoorsCondition',
          type: 'textarea',
          placeholder: 'Stan okien i drzwi zewnętrznych...',
        },
      ],
    },
    SECTION_FINDINGS,
    SECTION_DATES_SIGN,
  ],
};

const COMPLIANCE_FIVE_YEAR_BUILDING: DocumentTemplate = {
  key: 'compliance_five_year_building',
  category: 'COMPLIANCE',
  titleKey: 'docTemplates.compliance.fiveYearBuilding.title',
  descriptionKey: 'docTemplates.compliance.fiveYearBuilding.desc',
  version: '1.0',
  references: [
    {
      text: 'Ustawa Prawo budowlane, art. 62 ust. 1 pkt 2 (przegląd 5-letni), Dz.U. 1994 nr 89 poz. 414 ze zm.',
      url: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19940890414',
    },
  ],
  dossierCategory: 'OTHER',
  sections: [
    SECTION_OBJECT_DATA,
    SECTION_INSPECTION_PARTIES,
    {
      key: 'inspectionScope',
      titleKey: 'docTemplates.section.inspectionScope',
      fields: [
        {
          key: 'structural_condition',
          labelKey: 'docTemplates.fields.structuralCondition',
          type: 'textarea',
          placeholder: 'Stan fundamentów, ścian nośnych, stropów (widoczne elementy)...',
        },
        {
          key: 'roof_condition',
          labelKey: 'docTemplates.fields.roofCondition',
          type: 'textarea',
        },
        {
          key: 'facade_condition',
          labelKey: 'docTemplates.fields.facadeCondition',
          type: 'textarea',
        },
        {
          key: 'installations_condition',
          labelKey: 'docTemplates.fields.installationsCondition',
          type: 'textarea',
          placeholder: 'Stan instalacji wod-kan, c.o. (widoczne elementy)...',
        },
        {
          key: 'staircase_condition',
          labelKey: 'docTemplates.fields.staircaseCondition',
          type: 'textarea',
        },
        {
          key: 'overall_assessment',
          labelKey: 'docTemplates.fields.overallAssessment',
          type: 'select',
          options: ['fit_for_use', 'requires_repairs', 'requires_demolition'],
          required: true,
        },
      ],
    },
    SECTION_FINDINGS,
    SECTION_DATES_SIGN,
  ],
};

const COMPLIANCE_ELECTRICAL_LIGHTNING: DocumentTemplate = {
  key: 'compliance_electrical_lightning',
  category: 'COMPLIANCE',
  titleKey: 'docTemplates.compliance.electricalLightning.title',
  descriptionKey: 'docTemplates.compliance.electricalLightning.desc',
  version: '1.0',
  references: [
    {
      text: 'Ustawa Prawo budowlane, art. 62 ust. 1 pkt 2 (przegląd 5-letni — inst. elektryczna), Dz.U. 1994 nr 89 poz. 414 ze zm.',
      url: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19940890414',
    },
    { text: 'Norma PN-HD 60364 (instalacje elektryczne niskiego napięcia) — TODO: zweryfikuj aktualną edycję.' },
    { text: 'Norma PN-EN 62305 (ochrona odgromowa) — TODO: zweryfikuj aktualną edycję.' },
    { text: 'Wymagania kwalifikacyjne SEP — TODO: zweryfikuj aktualne rozporządzenie.' },
  ],
  dossierCategory: 'OTHER',
  sections: [
    SECTION_OBJECT_DATA,
    SECTION_INSPECTION_PARTIES,
    {
      key: 'electricalScope',
      titleKey: 'docTemplates.section.electricalScope',
      fields: [
        {
          key: 'switchboard_condition',
          labelKey: 'docTemplates.fields.switchboardCondition',
          type: 'textarea',
          placeholder: 'Stan rozdzielnicy głównej i tablic piętrowych...',
        },
        {
          key: 'wiring_condition',
          labelKey: 'docTemplates.fields.wiringCondition',
          type: 'textarea',
          placeholder: 'Stan przewodów i kabli (oględziny)...',
        },
        {
          key: 'measurement_continuity',
          labelKey: 'docTemplates.fields.measurementContinuity',
          type: 'text',
          placeholder: 'Wynik pomiaru ciągłości obwodów ochronnych [Ω]',
        },
        {
          key: 'measurement_insulation',
          labelKey: 'docTemplates.fields.measurementInsulation',
          type: 'text',
          placeholder: 'Wynik pomiaru rezystancji izolacji [MΩ]',
        },
        {
          key: 'rcd_test',
          labelKey: 'docTemplates.fields.rcdTest',
          type: 'text',
          placeholder: 'Wynik testu wyłączników RCD — czas zadziałania [ms]',
        },
      ],
    },
    {
      key: 'lightningScope',
      titleKey: 'docTemplates.section.lightningScope',
      fields: [
        {
          key: 'lightning_rods_condition',
          labelKey: 'docTemplates.fields.lightningRodsCondition',
          type: 'textarea',
          placeholder: 'Stan zwodów pionowych i poziomych...',
        },
        {
          key: 'earthing_resistance',
          labelKey: 'docTemplates.fields.earthingResistance',
          type: 'text',
          placeholder: 'Wynik pomiaru uziemienia [Ω]',
        },
        {
          key: 'connections_condition',
          labelKey: 'docTemplates.fields.connectionsCondition',
          type: 'textarea',
          placeholder: 'Stan połączeń i złączy kontrolnych...',
        },
      ],
    },
    SECTION_FINDINGS,
    SECTION_DATES_SIGN,
  ],
};

const COMPLIANCE_GAS_CHIMNEY: DocumentTemplate = {
  key: 'compliance_gas_chimney',
  category: 'COMPLIANCE',
  titleKey: 'docTemplates.compliance.gasChimney.title',
  descriptionKey: 'docTemplates.compliance.gasChimney.desc',
  version: '1.0',
  references: [
    {
      text: 'Ustawa Prawo budowlane, art. 62 ust. 1 pkt 1 (przegląd roczny — instalacja gazowa i kominowa), Dz.U. 1994 nr 89 poz. 414 ze zm.',
      url: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19940890414',
    },
    { text: 'Warunki Techniczne dot. instalacji gazowych — TODO: zweryfikuj aktualny numer i rok rozporządzenia.' },
    { text: 'Przepisy ochrony przeciwpożarowej dot. przewodów kominowych — TODO: zweryfikuj aktualne rozporządzenie.' },
  ],
  dossierCategory: 'OTHER',
  sections: [
    SECTION_OBJECT_DATA,
    SECTION_INSPECTION_PARTIES,
    {
      key: 'gasScope',
      titleKey: 'docTemplates.section.gasScope',
      fields: [
        {
          key: 'gas_tightness_test',
          labelKey: 'docTemplates.fields.gasTightnessTest',
          type: 'textarea',
          placeholder: 'Metoda próby szczelności, ciśnienie [bar/kPa], czas, wynik: szczelny/nieszczelny',
          required: true,
        },
        {
          key: 'gas_valves_condition',
          labelKey: 'docTemplates.fields.gasValvesCondition',
          type: 'textarea',
          placeholder: 'Stan kurków gazowych, węży przyłączeniowych...',
        },
        {
          key: 'gas_appliances',
          labelKey: 'docTemplates.fields.gasAppliances',
          type: 'textarea',
          placeholder: 'Lista urządzeń gazowych z numerami seryjnymi',
        },
        {
          key: 'ventilation_ok',
          labelKey: 'docTemplates.fields.ventilationOk',
          type: 'checkbox',
        },
      ],
    },
    {
      key: 'chimneyScope',
      titleKey: 'docTemplates.section.chimneyScope',
      fields: [
        {
          key: 'chimney_flue_condition',
          labelKey: 'docTemplates.fields.chimneyFlueCondition',
          type: 'textarea',
          placeholder: 'Drożność i stan przewodów dymowych, spalinowych, wentylacyjnych...',
          required: true,
        },
        {
          key: 'chimney_outlets',
          labelKey: 'docTemplates.fields.chimneyOutlets',
          type: 'textarea',
          placeholder: 'Stan wylotów ponad dachem...',
        },
        {
          key: 'chimney_deposits',
          labelKey: 'docTemplates.fields.chimneyDeposits',
          type: 'textarea',
          placeholder: 'Osady, zawilgocenie, uszkodzenia...',
        },
      ],
    },
    SECTION_FINDINGS,
    SECTION_DATES_SIGN,
  ],
};

const COMPLIANCE_LARGE_BUILDING: DocumentTemplate = {
  key: 'compliance_large_building',
  category: 'COMPLIANCE',
  titleKey: 'docTemplates.compliance.largeBuilding.title',
  descriptionKey: 'docTemplates.compliance.largeBuilding.desc',
  version: '1.0',
  references: [
    {
      text: 'Ustawa Prawo budowlane, art. 62 ust. 1 pkt 1b (obiekty > 2000 m² — dwa razy w roku), Dz.U. 1994 nr 89 poz. 414 ze zm.',
      url: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19940890414',
    },
  ],
  dossierCategory: 'OTHER',
  sections: [
    {
      key: 'objectDataLarge',
      titleKey: 'docTemplates.section.objectData',
      fields: [
        FIELD_OBJECT_ADDRESS, FIELD_OBJECT_TYPE,
        {
          key: 'floor_area_m2',
          labelKey: 'docTemplates.fields.floorAreaM2',
          type: 'number',
          required: true,
        },
        {
          key: 'roof_area_m2',
          labelKey: 'docTemplates.fields.roofAreaM2',
          type: 'number',
        },
        {
          key: 'inspection_type',
          labelKey: 'docTemplates.fields.inspectionType',
          type: 'select',
          options: ['spring_before_31_may', 'autumn_before_30_nov'],
          required: true,
        },
      ],
    },
    SECTION_INSPECTION_PARTIES,
    {
      key: 'largeBuildingScope',
      titleKey: 'docTemplates.section.inspectionScope',
      fields: [
        {
          key: 'roof_overall',
          labelKey: 'docTemplates.fields.roofOverall',
          type: 'textarea',
          required: true,
          placeholder: 'Stan całości połaci dachowej...',
        },
        {
          key: 'snow_load_assessment',
          labelKey: 'docTemplates.fields.snowLoadAssessment',
          type: 'textarea',
          placeholder: 'Ocena przeciążenia śniegiem (dla przeglądu jesiennego)',
        },
        {
          key: 'skylights_condition',
          labelKey: 'docTemplates.fields.skylightsCondition',
          type: 'textarea',
          placeholder: 'Stan świetlików i klap dymowych...',
        },
        {
          key: 'drainage_condition',
          labelKey: 'docTemplates.fields.drainageCondition',
          type: 'textarea',
          placeholder: 'Stan odwodnienia: rynny, wpusty dachowe...',
        },
      ],
    },
    SECTION_FINDINGS,
    SECTION_DATES_SIGN,
  ],
};

// ── All templates registry ─────────────────────────────────────────────────────

export const ALL_TEMPLATES: DocumentTemplate[] = [
  // Contracts
  CONTRACT_FIXED_PRICE,
  CONTRACT_COST_PLUS,
  CONTRACT_WITH_MATERIALS,
  CONTRACT_WITH_ADVANCE,
  CONTRACT_SIMPLE_ORDER,
  // Protocols
  PROTOCOL_FINAL_ACCEPTANCE,
  PROTOCOL_PARTIAL_ACCEPTANCE,
  PROTOCOL_SITE_HANDOVER,
  PROTOCOL_DEFECT_REPORT,
  PROTOCOL_NECESSITY_CHANGE,
  PROTOCOL_KEY_HANDOVER,
  PROTOCOL_WARRANTY_INSPECTION,
  PROTOCOL_HIDDEN_WORKS,
  PROTOCOL_DAMAGE,
  // Annexes
  ANNEX_CONTRACT_CHANGE,
  ANNEX_COST_ESTIMATE,
  ANNEX_MILESTONE_SCHEDULE,
  ANNEX_MATERIALS_CARD,
  ANNEX_HSE_CHECKLIST,
  ANNEX_CLIENT_STATEMENT,
  // Compliance / Inspections
  COMPLIANCE_ANNUAL_BUILDING,
  COMPLIANCE_FIVE_YEAR_BUILDING,
  COMPLIANCE_ELECTRICAL_LIGHTNING,
  COMPLIANCE_GAS_CHIMNEY,
  COMPLIANCE_LARGE_BUILDING,
];

export function getTemplateByKey(key: string): DocumentTemplate | undefined {
  return ALL_TEMPLATES.find((t) => t.key === key);
}

export function getTemplatesByCategory(category: TemplateCategory): DocumentTemplate[] {
  return ALL_TEMPLATES.filter((t) => t.category === category);
}
