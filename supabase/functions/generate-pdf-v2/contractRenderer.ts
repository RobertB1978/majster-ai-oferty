/**
 * generate-pdf-v2 — Renderer umowy o roboty budowlane (@react-pdf/renderer)
 *
 * Przyjmuje UnifiedDocumentPayload (schemaVersion: 2, documentType: 'contract')
 * i renderuje profesjonalny PDF umowy.
 *
 * ARCHITEKTURA:
 *   Wzorowany na protocolRenderer.ts — ten sam pipeline:
 *   UnifiedDocumentPayload → @react-pdf/renderer → binarny PDF (Uint8Array)
 *
 * SEKCJE PDF:
 *   1. Nagłówek (kolorowy pasek) — tytuł + dane firmy + numer dokumentu
 *   2. Dane stron — wykonawca + zleceniodawca
 *   3. Przedmiot umowy (subject)
 *   4. Wartość umowy — netto, VAT, brutto
 *   5. Termin realizacji — startDate → endDate
 *   6. Warunki płatności (opcjonalne)
 *   7. Podpisy (zleceniodawca + wykonawca)
 *   8. Stopka (numer strony, data generowania, Majster.AI)
 *
 * CZCIONKI: NotoSans/NotoSansMono (polskie znaki diakrytyczne) via font-config.ts
 *
 * Roadmap: PDF Platform v2 — Contract Canonical Renderer.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
// deno-lint-ignore-file no-explicit-any
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "npm:@react-pdf/renderer@3";
import React from "npm:react@18";
import type {
  UnifiedDocumentPayload,
  ContractDocumentSection,
} from "../_shared/unified-document-payload.ts";
import {
  getBodyFontFamily,
  getMonoFontFamily,
} from "../generate-offer-pdf/font-config.ts";
import {
  resolveTemplateVariant,
  getStyleTokens,
  type TradeType,
  type PlanTier,
  type BaseStyleTokens,
} from "../_shared/document-visual-system.ts";
import {
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_MUTED,
  BG_SURFACE,
  BG_SURFACE_RAISED,
  BORDER_DEFAULT,
  BORDER_SUBTLE,
} from "../_shared/pdf-tokens.ts";

// ── Czcionki (rejestracja odbywa się w offerRenderer — moduł ładowany wcześniej) ─
const BODY = getBodyFontFamily();
const MONO = getMonoFontFamily();

// ── Visual System Token Resolution ──────────────────────────────────────────

function resolveContractTokens(payload: UnifiedDocumentPayload): BaseStyleTokens {
  const trade = (payload.trade as TradeType) ?? "general";
  const planTier = (payload.planTier as PlanTier) ?? "basic";
  const variant = resolveTemplateVariant({
    documentType: "contract",
    trade,
    planTier,
  });
  return getStyleTokens(variant);
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: BODY,
    fontSize: 9.5,
    paddingTop: 40,
    paddingBottom: 70,
    paddingHorizontal: 40,
    backgroundColor: BG_SURFACE,
    color: TEXT_PRIMARY,
  },

  // ── Header band ──
  headerBand: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
  },
  headerLeft: {
    flex: 1,
  },
  docTitle: {
    fontSize: 20,
    fontFamily: BODY,
    fontWeight: "bold",
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 12,
    fontFamily: BODY,
    fontWeight: "bold",
    color: TEXT_SECONDARY,
    marginBottom: 2,
  },
  companyDetail: {
    fontSize: 8,
    color: TEXT_SECONDARY,
    lineHeight: 1.5,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  docId: {
    fontSize: 9,
    fontFamily: MONO,
    color: TEXT_SECONDARY,
    marginBottom: 2,
  },
  docDate: {
    fontSize: 8.5,
    color: TEXT_MUTED,
  },

  // ── Info cards ──
  infoRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    backgroundColor: BG_SURFACE_RAISED,
    borderRadius: 6,
    padding: 12,
  },
  infoLabel: {
    fontSize: 7,
    color: TEXT_MUTED,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 9.5,
    color: TEXT_PRIMARY,
    lineHeight: 1.5,
  },
  infoValueBold: {
    fontSize: 10,
    fontFamily: BODY,
    fontWeight: "bold",
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },

  // ── Content sections ──
  sectionContainer: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 8,
    fontFamily: BODY,
    fontWeight: "bold",
    color: TEXT_SECONDARY,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER_SUBTLE,
  },
  sectionText: {
    fontSize: 9.5,
    color: TEXT_PRIMARY,
    lineHeight: 1.6,
  },

  // ── Value cards ──
  valueRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  valueCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER_DEFAULT,
    borderRadius: 6,
    padding: 10,
  },
  valueLabel: {
    fontSize: 7,
    color: TEXT_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  valueAmount: {
    fontSize: 10,
    fontFamily: MONO,
    color: TEXT_PRIMARY,
  },
  valueAmountGross: {
    fontSize: 12,
    fontFamily: MONO,
    fontWeight: "bold",
  },

  // ── Period cards ──
  periodRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  periodCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER_DEFAULT,
    borderRadius: 6,
    padding: 10,
  },
  periodLabel: {
    fontSize: 7,
    color: TEXT_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  periodValue: {
    fontSize: 10,
    fontFamily: MONO,
    color: TEXT_PRIMARY,
  },

  // ── Signatures ──
  signaturesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 0.5,
    borderTopColor: BORDER_DEFAULT,
  },
  signatureBlock: {
    width: 160,
    alignItems: "center",
  },
  signatureLine: {
    fontSize: 8,
    color: TEXT_MUTED,
    marginBottom: 8,
  },
  signatureDots: {
    fontSize: 9,
    color: TEXT_MUTED,
  },

  // ── Footer ──
  footer: {
    position: "absolute",
    bottom: 25,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: BORDER_DEFAULT,
    paddingTop: 8,
  },
  footerLeft: {
    fontSize: 7.5,
    color: TEXT_MUTED,
  },
  footerCenter: {
    fontSize: 7.5,
    color: TEXT_MUTED,
  },
  footerRight: {
    fontSize: 7.5,
    fontFamily: MONO,
    color: TEXT_MUTED,
  },
});

// ── Locale labels ────────────────────────────────────────────────────────────

interface ContractLabels {
  title: string;
  contractor: string;
  client: string;
  subject: string;
  contractValue: string;
  netAmount: string;
  vatRate: string;
  vatExempt: string;
  grossAmount: string;
  period: string;
  startDate: string;
  endDate: string;
  indefinite: string;
  paymentTerms: string;
  sigContractor: string;
  sigClient: string;
  footerGenerated: string;
  footerPage: (n: number, total: number) => string;
}

const LABELS: Record<string, ContractLabels> = {
  pl: {
    title: "UMOWA O ROBOTY BUDOWLANE",
    contractor: "WYKONAWCA",
    client: "ZLECENIODAWCA",
    subject: "PRZEDMIOT UMOWY",
    contractValue: "WARTO\u015A\u0106 UMOWY",
    netAmount: "KWOTA NETTO",
    vatRate: "STAWKA VAT",
    vatExempt: "zw.",
    grossAmount: "KWOTA BRUTTO",
    period: "TERMIN REALIZACJI",
    startDate: "DATA ROZPOCZ\u0118CIA",
    endDate: "DATA ZAKO\u0143CZENIA",
    indefinite: "bezterminowo",
    paymentTerms: "WARUNKI P\u0141ATNO\u015ACI",
    sigContractor: "Podpis wykonawcy",
    sigClient: "Podpis zleceniodawcy",
    footerGenerated: "Wygenerowano",
    footerPage: (n, total) => `Strona ${n} / ${total}`,
  },
  en: {
    title: "CONSTRUCTION WORKS CONTRACT",
    contractor: "CONTRACTOR",
    client: "CLIENT",
    subject: "SUBJECT OF CONTRACT",
    contractValue: "CONTRACT VALUE",
    netAmount: "NET AMOUNT",
    vatRate: "VAT RATE",
    vatExempt: "exempt",
    grossAmount: "GROSS AMOUNT",
    period: "EXECUTION PERIOD",
    startDate: "START DATE",
    endDate: "END DATE",
    indefinite: "indefinite",
    paymentTerms: "PAYMENT TERMS",
    sigContractor: "Contractor signature",
    sigClient: "Client signature",
    footerGenerated: "Generated",
    footerPage: (n, total) => `Page ${n} / ${total}`,
  },
  uk: {
    title: "\u0414\u041E\u0413\u041E\u0412\u0406\u0420 \u041D\u0410 \u0411\u0423\u0414\u0406\u0412\u0415\u041B\u042C\u041D\u0406 \u0420\u041E\u0411\u041E\u0422\u0418",
    contractor: "\u0412\u0418\u041A\u041E\u041D\u0410\u0412\u0415\u0426\u042C",
    client: "\u0417\u0410\u041C\u041E\u0412\u041D\u0418\u041A",
    subject: "\u041F\u0420\u0415\u0414\u041C\u0415\u0422 \u0414\u041E\u0413\u041E\u0412\u041E\u0420\u0423",
    contractValue: "\u0412\u0410\u0420\u0422\u0406\u0421\u0422\u042C \u0414\u041E\u0413\u041E\u0412\u041E\u0420\u0423",
    netAmount: "\u0421\u0423\u041C\u0410 \u041D\u0415\u0422\u0422\u041E",
    vatRate: "\u0421\u0422\u0410\u0412\u041A\u0410 \u041F\u0414\u0412",
    vatExempt: "\u0437\u0432.",
    grossAmount: "\u0421\u0423\u041C\u0410 \u0411\u0420\u0423\u0422\u0422\u041E",
    period: "\u0422\u0415\u0420\u041C\u0406\u041D \u0412\u0418\u041A\u041E\u041D\u0410\u041D\u041D\u042F",
    startDate: "\u0414\u0410\u0422\u0410 \u041F\u041E\u0427\u0410\u0422\u041A\u0423",
    endDate: "\u0414\u0410\u0422\u0410 \u0417\u0410\u041A\u0406\u041D\u0427\u0415\u041D\u041D\u042F",
    indefinite: "\u0431\u0435\u0437\u0441\u0442\u0440\u043E\u043A\u043E\u0432\u043E",
    paymentTerms: "\u0423\u041C\u041E\u0412\u0418 \u041E\u041F\u041B\u0410\u0422\u0418",
    sigContractor: "\u041F\u0456\u0434\u043F\u0438\u0441 \u0432\u0438\u043A\u043E\u043D\u0430\u0432\u0446\u044F",
    sigClient: "\u041F\u0456\u0434\u043F\u0438\u0441 \u0437\u0430\u043C\u043E\u0432\u043D\u0438\u043A\u0430",
    footerGenerated: "\u0417\u0433\u0435\u043D\u0435\u0440\u043E\u0432\u0430\u043D\u043E",
    footerPage: (n, total) => `\u0421\u0442\u043E\u0440\u0456\u043D\u043A\u0430 ${n} / ${total}`,
  },
};

function resolveEdgeLang(locale?: string): string {
  if (!locale) return "pl";
  const lang = locale.split("-")[0].toLowerCase();
  return LABELS[lang] ? lang : "pl";
}

function getContractLabels(locale?: string): ContractLabels {
  return LABELS[resolveEdgeLang(locale)];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | undefined, locale?: string): string {
  if (!iso) return "\u2014";
  try {
    return new Date(iso).toLocaleDateString(locale ?? "pl-PL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
  }).format(value);
}

function calculateGross(value: number, vatRate: number | null): number {
  if (vatRate === null) return value;
  return value * (1 + vatRate / 100);
}

function e(type: any, props: any, ...children: any[]): any {
  return React.createElement(type, props, ...children);
}

// ── Sub-components ──────────────────────────────────────────────────────────

function buildSectionLabelWithAccent(
  text: string,
  tokens: BaseStyleTokens,
) {
  return e(Text, {
    style: [
      styles.sectionLabel,
      { borderBottomColor: tokens.sectionAccent },
    ],
  }, text);
}

function buildHeader(
  payload: UnifiedDocumentPayload,
  labels: ContractLabels,
  tokens: BaseStyleTokens,
) {
  const { company, documentId } = payload;
  const companyLines: string[] = [];
  const regParts: string[] = [];
  if (company.nip) regParts.push(`NIP: ${company.nip}`);
  if (company.regon) regParts.push(`REGON: ${company.regon}`);
  if (company.krs) regParts.push(`KRS: ${company.krs}`);
  if (regParts.length > 0) companyLines.push(regParts.join(" \u00B7 "));
  const address = [company.street, company.postalCode, company.city]
    .filter(Boolean)
    .join(", ");
  if (address) companyLines.push(address);
  if (company.phone) companyLines.push(`tel. ${company.phone}`);
  if (company.email) companyLines.push(company.email);

  return e(
    View,
    { style: [styles.headerBand, { borderBottomColor: tokens.sectionAccent }] },
    e(
      View,
      { style: styles.headerLeft },
      e(Text, { style: styles.docTitle }, labels.title),
      e(Text, { style: styles.companyName }, company.name),
      ...companyLines.map((line, i) =>
        e(Text, { key: `cd-${i}`, style: styles.companyDetail }, line)
      ),
    ),
    e(
      View,
      { style: styles.headerRight },
      e(Text, { style: styles.docId }, documentId),
      e(
        Text,
        { style: styles.docDate },
        formatDate(payload.issuedAt, payload.locale),
      ),
    ),
  );
}

function buildInfoCards(
  payload: UnifiedDocumentPayload,
  labels: ContractLabels,
) {
  const { company, client } = payload;

  return e(
    View,
    { style: styles.infoRow },
    e(
      View,
      { style: styles.infoCard },
      e(Text, { style: styles.infoLabel }, labels.contractor),
      e(Text, { style: styles.infoValueBold }, company.name),
      company.nip
        ? e(Text, { style: styles.infoValue }, `NIP: ${company.nip}`)
        : null,
      company.phone
        ? e(Text, { style: styles.infoValue }, `tel. ${company.phone}`)
        : null,
      company.email
        ? e(Text, { style: styles.infoValue }, company.email)
        : null,
    ),
    client
      ? e(
          View,
          { style: styles.infoCard },
          e(Text, { style: styles.infoLabel }, labels.client),
          e(Text, { style: styles.infoValueBold }, client.name),
          client.address
            ? e(Text, { style: styles.infoValue }, client.address)
            : null,
          client.phone
            ? e(Text, { style: styles.infoValue }, `tel. ${client.phone}`)
            : null,
          client.email
            ? e(Text, { style: styles.infoValue }, client.email)
            : null,
        )
      : null,
  );
}

function buildSubjectSection(
  section: ContractDocumentSection,
  labels: ContractLabels,
  tokens: BaseStyleTokens,
) {
  return e(
    View,
    { style: styles.sectionContainer },
    buildSectionLabelWithAccent(labels.subject, tokens),
    e(Text, { style: styles.sectionText }, section.subject),
  );
}

function buildValueSection(
  section: ContractDocumentSection,
  labels: ContractLabels,
  tokens: BaseStyleTokens,
) {
  const gross = calculateGross(section.value, section.vatRate);
  const vatDisplay = section.vatRate !== null
    ? `${section.vatRate}%`
    : labels.vatExempt;

  return e(
    View,
    { style: styles.sectionContainer },
    buildSectionLabelWithAccent(labels.contractValue, tokens),
    e(
      View,
      { style: styles.valueRow },
      e(
        View,
        { style: styles.valueCard },
        e(Text, { style: styles.valueLabel }, labels.netAmount),
        e(Text, { style: styles.valueAmount }, formatCurrency(section.value)),
      ),
      e(
        View,
        { style: styles.valueCard },
        e(Text, { style: styles.valueLabel }, labels.vatRate),
        e(Text, { style: styles.valueAmount }, vatDisplay),
      ),
      e(
        View,
        { style: styles.valueCard },
        e(Text, { style: styles.valueLabel }, labels.grossAmount),
        e(Text, { style: [styles.valueAmountGross, { color: tokens.grossAccent }] }, formatCurrency(gross)),
      ),
    ),
  );
}

function buildPeriodSection(
  section: ContractDocumentSection,
  labels: ContractLabels,
  tokens: BaseStyleTokens,
  locale?: string,
) {
  const endDateDisplay = section.endDate
    ? formatDate(section.endDate, locale)
    : labels.indefinite;

  return e(
    View,
    { style: styles.sectionContainer },
    buildSectionLabelWithAccent(labels.period, tokens),
    e(
      View,
      { style: styles.periodRow },
      e(
        View,
        { style: styles.periodCard },
        e(Text, { style: styles.periodLabel }, labels.startDate),
        e(Text, { style: styles.periodValue }, formatDate(section.startDate, locale)),
      ),
      e(
        View,
        { style: styles.periodCard },
        e(Text, { style: styles.periodLabel }, labels.endDate),
        e(Text, { style: styles.periodValue }, endDateDisplay),
      ),
    ),
  );
}

function buildPaymentTermsSection(
  section: ContractDocumentSection,
  labels: ContractLabels,
  tokens: BaseStyleTokens,
) {
  if (!section.paymentTerms) return null;
  return e(
    View,
    { style: styles.sectionContainer },
    buildSectionLabelWithAccent(labels.paymentTerms, tokens),
    e(Text, { style: styles.sectionText }, section.paymentTerms),
  );
}

function buildSignatures(labels: ContractLabels) {
  return e(
    View,
    { style: styles.signaturesRow },
    e(
      View,
      { style: styles.signatureBlock },
      e(Text, { style: styles.signatureDots }, "..................................."),
      e(Text, { style: styles.signatureLine }, labels.sigContractor),
    ),
    e(
      View,
      { style: styles.signatureBlock },
      e(Text, { style: styles.signatureDots }, "..................................."),
      e(Text, { style: styles.signatureLine }, labels.sigClient),
    ),
  );
}

function buildFooter(
  payload: UnifiedDocumentPayload,
  labels: ContractLabels,
  tokens: BaseStyleTokens,
) {
  const locale = payload.locale;
  return e(
    View,
    { style: [styles.footer, { borderTopColor: tokens.sectionAccent }], fixed: true },
    e(Text, { style: styles.footerLeft }, payload.company.name),
    e(
      Text,
      { style: styles.footerCenter },
      `${labels.footerGenerated} ${formatDate(payload.generatedAt, locale)}`,
    ),
    e(Text, {
      style: styles.footerRight,
      render: ({ pageNumber, totalPages }: any) =>
        labels.footerPage(pageNumber, totalPages),
    }),
  );
}

// ── Document factory ────────────────────────────────────────────────────────

export function buildContractDocument(
  payload: UnifiedDocumentPayload,
): unknown {
  const section = payload.section as ContractDocumentSection;
  const labels = getContractLabels(payload.locale);
  const tokens = resolveContractTokens(payload);

  const pageContent: any[] = [
    buildHeader(payload, labels, tokens),
    buildInfoCards(payload, labels),
    buildSubjectSection(section, labels, tokens),
    buildValueSection(section, labels, tokens),
    buildPeriodSection(section, labels, tokens, payload.locale),
    buildPaymentTermsSection(section, labels, tokens),
    buildSignatures(labels),
    buildFooter(payload, labels, tokens),
  ];

  return e(
    Document,
    { title: `${labels.title} \u2014 ${payload.documentId}` },
    e(
      Page,
      { size: "A4", style: styles.page, wrap: true },
      ...pageContent.filter(Boolean),
    ),
  );
}

// ── Publiczne API ───────────────────────────────────────────────────────────

/**
 * Renderuje umow\u0119 o roboty budowlane z UnifiedDocumentPayload v2 do binarnego PDF.
 *
 * @param payload - UnifiedDocumentPayload z documentType === 'contract'
 * @returns Uint8Array z zawarto\u015Bci\u0105 PDF
 * @throws je\u015Bli section.type nie jest 'contract' lub renderowanie si\u0119 nie powiod\u0142o
 */
export async function renderContractFromV2Payload(
  payload: UnifiedDocumentPayload,
): Promise<Uint8Array> {
  if (payload.section.type !== "contract") {
    throw new Error(
      `renderContractFromV2Payload: oczekiwano section.type='contract', otrzymano '${payload.section.type}'.`,
    );
  }

  const doc = buildContractDocument(payload);
  const buffer = await renderToBuffer(doc as any);
  return new Uint8Array(buffer);
}
