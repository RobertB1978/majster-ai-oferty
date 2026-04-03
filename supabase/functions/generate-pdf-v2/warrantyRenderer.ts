/**
 * generate-pdf-v2 — Renderer gwarancji (@react-pdf/renderer)
 *
 * Przyjmuje UnifiedDocumentPayload (schemaVersion: 2, documentType: 'warranty')
 * i renderuje profesjonalny PDF karty gwarancyjnej.
 *
 * ARCHITEKTURA:
 *   Wzorowany na offerRenderer.ts — ten sam pipeline:
 *   UnifiedDocumentPayload → @react-pdf/renderer → binarny PDF (Uint8Array)
 *
 *   Różnica: offerRenderer.ts adaptuje v2→v1 (reuse istniejącego renderera),
 *   natomiast warrantyRenderer.ts renderuje bezpośrednio z v2 payloadu —
 *   nie potrzebuje adaptera, ponieważ nie ma legacy renderera gwarancji.
 *
 * SEKCJE PDF:
 *   1. Nagłówek (niebieski pasek) — tytuł + dane firmy + numer dokumentu
 *   2. Karty informacyjne — gwarant + beneficjent
 *   3. Okres gwarancji — daty + czas trwania
 *   4. Zakres prac (opcjonalny)
 *   5. Wyłączenia (opcjonalne)
 *   6. Podstawa prawna
 *   7. Podpisy
 *   8. Stopka
 *
 * CZCIONKI: NotoSans/NotoSansMono (polskie znaki diakrytyczne) via font-config.ts
 *
 * Roadmap: PDF Platform v2 — Warranty Canonical Renderer.
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
  WarrantyDocumentSection,
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

// ── Czcionki (rejestracja odbywa się w offerRenderer — moduł ładowany wcześniej) ─
const BODY = getBodyFontFamily();
const MONO = getMonoFontFamily();

// ── Design Tokens ────────────────────────────────────────────────────────────

const COLORS = {
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  bgSurface: "#FFFFFF",
  bgSurfaceRaised: "#F5F3EF",
  borderDefault: "#E8E4DC",
  borderSubtle: "#F0EDE8",
  accentBlue: "#1E40AF",
  accentBlueSubtle: "#EFF6FF",
};

// ── Visual System Token Resolution ──────────────────────────────────────────

function resolveWarrantyTokens(payload: UnifiedDocumentPayload): BaseStyleTokens {
  const trade = (payload.trade as TradeType) ?? "general";
  const planTier = (payload.planTier as PlanTier) ?? "basic";
  const variant = resolveTemplateVariant({
    documentType: "warranty",
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
    backgroundColor: COLORS.bgSurface,
    color: COLORS.textPrimary,
  },

  // ── Header band ──
  headerBand: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accentBlue,
  },
  headerLeft: {
    flex: 1,
  },
  docTitle: {
    fontSize: 20,
    fontFamily: BODY,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 12,
    fontFamily: BODY,
    fontWeight: "bold",
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  companyDetail: {
    fontSize: 8,
    color: COLORS.textSecondary,
    lineHeight: 1.5,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  docId: {
    fontSize: 9,
    fontFamily: MONO,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  docDate: {
    fontSize: 8.5,
    color: COLORS.textMuted,
  },

  // ── Info cards ──
  infoRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    backgroundColor: COLORS.bgSurfaceRaised,
    borderRadius: 6,
    padding: 12,
  },
  infoLabel: {
    fontSize: 7,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 9.5,
    color: COLORS.textPrimary,
    lineHeight: 1.5,
  },
  infoValueBold: {
    fontSize: 10,
    fontFamily: BODY,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 2,
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
    borderColor: COLORS.borderDefault,
    borderRadius: 6,
    padding: 10,
  },
  periodLabel: {
    fontSize: 7,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  periodValue: {
    fontSize: 10,
    fontFamily: MONO,
    color: COLORS.textPrimary,
  },

  // ── Content sections ──
  sectionContainer: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 8,
    fontFamily: BODY,
    fontWeight: "bold",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.borderSubtle,
  },
  sectionText: {
    fontSize: 9.5,
    color: COLORS.textPrimary,
    lineHeight: 1.6,
  },

  // ── Legal section ──
  legalSection: {
    marginTop: 12,
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.borderDefault,
  },
  legalText: {
    fontSize: 8,
    color: COLORS.textSecondary,
    lineHeight: 1.5,
  },

  // ── Signatures ──
  signaturesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.borderDefault,
  },
  signatureBlock: {
    width: 160,
    alignItems: "center",
  },
  signatureLine: {
    fontSize: 8,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  signatureDots: {
    fontSize: 9,
    color: COLORS.textMuted,
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
    borderTopColor: COLORS.borderDefault,
    paddingTop: 8,
  },
  footerLeft: {
    fontSize: 7.5,
    color: COLORS.textMuted,
  },
  footerCenter: {
    fontSize: 7.5,
    color: COLORS.textMuted,
  },
  footerRight: {
    fontSize: 7.5,
    fontFamily: MONO,
    color: COLORS.textMuted,
  },
});

// ── Locale labels ────────────────────────────────────────────────────────────

interface WarrantyLabels {
  title: string;
  warrantor: string;
  beneficiary: string;
  startDate: string;
  endDate: string;
  duration: string;
  months: string;
  scopeOfWork: string;
  exclusions: string;
  legalBasis: string;
  legalText: string;
  sigWarrantor: string;
  sigBeneficiary: string;
  footerGenerated: string;
  footerPage: (n: number, total: number) => string;
}

const LABELS: Record<string, WarrantyLabels> = {
  pl: {
    title: "KARTA GWARANCYJNA",
    warrantor: "GWARANT",
    beneficiary: "BENEFICJENT",
    startDate: "DATA ROZPOCZ\u0118CIA",
    endDate: "DATA ZAKO\u0143CZENIA",
    duration: "OKRES GWARANCJI",
    months: "mies.",
    scopeOfWork: "ZAKRES PRAC OBJ\u0118TYCH GWARANCJ\u0104",
    exclusions: "WY\u0141\u0104CZENIA Z GWARANCJI",
    legalBasis: "PODSTAWA PRAWNA",
    legalText:
      "Niniejsza gwarancja jest udzielana na podstawie art. 577\u2013581 Kodeksu cywilnego. " +
      "Gwarancja nie wy\u0142\u0105cza, nie ogranicza ani nie zawiesza uprawnie\u0144 kupuj\u0105cego " +
      "wynikaj\u0105cych z przepis\u00F3w o r\u0119kojmi za wady.",
    sigWarrantor: "Podpis gwaranta",
    sigBeneficiary: "Podpis beneficjenta",
    footerGenerated: "Wygenerowano",
    footerPage: (n, total) => `Strona ${n} / ${total}`,
  },
  en: {
    title: "WARRANTY CARD",
    warrantor: "WARRANTOR",
    beneficiary: "BENEFICIARY",
    startDate: "START DATE",
    endDate: "END DATE",
    duration: "WARRANTY PERIOD",
    months: "months",
    scopeOfWork: "SCOPE OF WORK COVERED",
    exclusions: "WARRANTY EXCLUSIONS",
    legalBasis: "LEGAL BASIS",
    legalText:
      "This warranty is granted pursuant to the applicable civil code provisions. " +
      "The warranty does not exclude, limit or suspend the buyer's rights " +
      "arising from statutory warranty for defects.",
    sigWarrantor: "Warrantor signature",
    sigBeneficiary: "Beneficiary signature",
    footerGenerated: "Generated",
    footerPage: (n, total) => `Page ${n} / ${total}`,
  },
  uk: {
    title: "\u0413\u0410\u0420\u0410\u041D\u0422\u0406\u0419\u041D\u0410 \u041A\u0410\u0420\u0422\u041A\u0410",
    warrantor: "\u0413\u0410\u0420\u0410\u041D\u0422",
    beneficiary: "\u0411\u0415\u041D\u0415\u0424\u0406\u0426\u0406\u0410\u0420",
    startDate: "\u0414\u0410\u0422\u0410 \u041F\u041E\u0427\u0410\u0422\u041A\u0423",
    endDate: "\u0414\u0410\u0422\u0410 \u0417\u0410\u041A\u0406\u041D\u0427\u0415\u041D\u041D\u042F",
    duration: "\u0413\u0410\u0420\u0410\u041D\u0422\u0406\u0419\u041D\u0418\u0419 \u041F\u0415\u0420\u0406\u041E\u0414",
    months: "\u043C\u0456\u0441.",
    scopeOfWork: "\u041E\u0411\u0421\u042F\u0413 \u0420\u041E\u0411\u0406\u0422",
    exclusions: "\u0412\u0418\u041A\u041B\u042E\u0427\u0415\u041D\u041D\u042F",
    legalBasis: "\u041F\u0420\u0410\u0412\u041E\u0412\u0410 \u041E\u0421\u041D\u041E\u0412\u0410",
    legalText:
      "\u0426\u044F \u0433\u0430\u0440\u0430\u043D\u0442\u0456\u044F \u043D\u0430\u0434\u0430\u0454\u0442\u044C\u0441\u044F \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u043D\u043E \u0434\u043E \u0447\u0438\u043D\u043D\u043E\u0433\u043E \u0437\u0430\u043A\u043E\u043D\u043E\u0434\u0430\u0432\u0441\u0442\u0432\u0430.",
    sigWarrantor: "\u041F\u0456\u0434\u043F\u0438\u0441 \u0433\u0430\u0440\u0430\u043D\u0442\u0430",
    sigBeneficiary: "\u041F\u0456\u0434\u043F\u0438\u0441 \u0431\u0435\u043D\u0435\u0444\u0456\u0446\u0456\u0430\u0440\u0430",
    footerGenerated: "\u0417\u0433\u0435\u043D\u0435\u0440\u043E\u0432\u0430\u043D\u043E",
    footerPage: (n, total) => `\u0421\u0442\u043E\u0440\u0456\u043D\u043A\u0430 ${n} / ${total}`,
  },
};

function resolveEdgeLang(locale?: string): string {
  if (!locale) return "pl";
  const lang = locale.split("-")[0].toLowerCase();
  return LABELS[lang] ? lang : "pl";
}

function getWarrantyLabels(locale?: string): WarrantyLabels {
  return LABELS[resolveEdgeLang(locale)];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string, locale?: string): string {
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
  labels: WarrantyLabels,
  tokens: BaseStyleTokens,
) {
  const { company, documentId } = payload;
  const companyLines: string[] = [];
  const regParts: string[] = [];
  if (company.nip) regParts.push(`NIP: ${company.nip}`);
  if (company.regon) regParts.push(`REGON: ${company.regon}`);
  if (company.krs) regParts.push(`KRS: ${company.krs}`);
  if (regParts.length > 0) companyLines.push(regParts.join(" · "));
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
  labels: WarrantyLabels,
) {
  const { company, client } = payload;

  return e(
    View,
    { style: styles.infoRow },
    e(
      View,
      { style: styles.infoCard },
      e(Text, { style: styles.infoLabel }, labels.warrantor),
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
          e(Text, { style: styles.infoLabel }, labels.beneficiary),
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

function buildPeriodCards(
  section: WarrantyDocumentSection,
  labels: WarrantyLabels,
  locale?: string,
) {
  return e(
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
      e(Text, { style: styles.periodValue }, formatDate(section.endDate, locale)),
    ),
    e(
      View,
      { style: styles.periodCard },
      e(Text, { style: styles.periodLabel }, labels.duration),
      e(
        Text,
        { style: styles.periodValue },
        `${section.warrantyMonths} ${labels.months}`,
      ),
    ),
  );
}

function buildScopeSection(
  section: WarrantyDocumentSection,
  labels: WarrantyLabels,
  tokens: BaseStyleTokens,
) {
  if (!section.scopeOfWork) return null;
  return e(
    View,
    { style: styles.sectionContainer },
    buildSectionLabelWithAccent(labels.scopeOfWork, tokens),
    e(Text, { style: styles.sectionText }, section.scopeOfWork),
  );
}

function buildExclusionsSection(
  section: WarrantyDocumentSection,
  labels: WarrantyLabels,
  tokens: BaseStyleTokens,
) {
  if (!section.exclusions) return null;
  return e(
    View,
    { style: styles.sectionContainer },
    buildSectionLabelWithAccent(labels.exclusions, tokens),
    e(Text, { style: styles.sectionText }, section.exclusions),
  );
}

function buildLegalSection(labels: WarrantyLabels, tokens: BaseStyleTokens) {
  return e(
    View,
    { style: [styles.legalSection, { borderTopColor: tokens.sectionAccent }] },
    buildSectionLabelWithAccent(labels.legalBasis, tokens),
    e(Text, { style: styles.legalText }, labels.legalText),
  );
}

function buildSignatures(labels: WarrantyLabels) {
  return e(
    View,
    { style: styles.signaturesRow },
    e(
      View,
      { style: styles.signatureBlock },
      e(Text, { style: styles.signatureDots }, "..................................."),
      e(Text, { style: styles.signatureLine }, labels.sigWarrantor),
    ),
    e(
      View,
      { style: styles.signatureBlock },
      e(Text, { style: styles.signatureDots }, "..................................."),
      e(Text, { style: styles.signatureLine }, labels.sigBeneficiary),
    ),
  );
}

function buildFooter(
  payload: UnifiedDocumentPayload,
  labels: WarrantyLabels,
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

export function buildWarrantyDocument(
  payload: UnifiedDocumentPayload,
): unknown {
  const section = payload.section as WarrantyDocumentSection;
  const labels = getWarrantyLabels(payload.locale);
  const tokens = resolveWarrantyTokens(payload);

  const pageContent: any[] = [
    buildHeader(payload, labels, tokens),
    buildInfoCards(payload, labels),
    buildPeriodCards(section, labels, payload.locale),
    buildScopeSection(section, labels, tokens),
    buildExclusionsSection(section, labels, tokens),
    buildLegalSection(labels, tokens),
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
 * Renderuje gwarancj\u0119 z UnifiedDocumentPayload v2 do binarnego PDF.
 *
 * @param payload - UnifiedDocumentPayload z documentType === 'warranty'
 * @returns Uint8Array z zawarto\u015Bci\u0105 PDF
 * @throws je\u015Bli section.type nie jest 'warranty' lub renderowanie si\u0119 nie powiod\u0142o
 */
export async function renderWarrantyFromV2Payload(
  payload: UnifiedDocumentPayload,
): Promise<Uint8Array> {
  if (payload.section.type !== "warranty") {
    throw new Error(
      `renderWarrantyFromV2Payload: oczekiwano section.type='warranty', otrzymano '${payload.section.type}'.`,
    );
  }

  const doc = buildWarrantyDocument(payload);
  const buffer = await renderToBuffer(doc as any);
  return new Uint8Array(buffer);
}
