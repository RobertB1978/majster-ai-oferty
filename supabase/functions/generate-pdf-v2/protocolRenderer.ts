/**
 * generate-pdf-v2 — Renderer protokołu odbioru robót (@react-pdf/renderer)
 *
 * Przyjmuje UnifiedDocumentPayload (schemaVersion: 2, documentType: 'protocol')
 * i renderuje profesjonalny PDF protokołu odbioru.
 *
 * ARCHITEKTURA:
 *   Wzorowany na warrantyRenderer.ts — ten sam pipeline:
 *   UnifiedDocumentPayload → @react-pdf/renderer → binarny PDF (Uint8Array)
 *
 * SEKCJE PDF:
 *   1. Nagłówek (kolorowy pasek) — tytuł + dane firmy + numer dokumentu
 *   2. Karty informacyjne — zleceniodawca + zleceniobiorca
 *   3. Data odbioru (receptionDate)
 *   4. Tabela pozycji do odbioru (items[])
 *   5. Uwagi ogólne (notes — opcjonalne)
 *   6. Podpisy (zleceniodawca + wykonawca)
 *   7. Stopka (numer strony, data generowania, Majster.AI)
 *
 * CZCIONKI: NotoSans/NotoSansMono (polskie znaki diakrytyczne) via font-config.ts
 *
 * Roadmap: PDF Platform v2 — Protocol Canonical Renderer.
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
  ProtocolDocumentSection,
  ProtocolItem,
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
  STATE_SUCCESS,
  STATE_ERROR,
  STATE_SUCCESS_BG,
  STATE_ERROR_BG,
} from "../_shared/pdf-tokens.ts";

// ── Czcionki (rejestracja odbywa się w offerRenderer — moduł ładowany wcześniej) ─
const BODY = getBodyFontFamily();
const MONO = getMonoFontFamily();

// ── Kolory statusów pozycji (z pdf-tokens.ts) ──────────────────────────────
const ROW_ACCEPTED_BG = STATE_SUCCESS_BG;
const ROW_REJECTED_BG = STATE_ERROR_BG;

// ── Visual System Token Resolution ──────────────────────────────────────────

function resolveProtocolTokens(payload: UnifiedDocumentPayload): BaseStyleTokens {
  const trade = (payload.trade as TradeType) ?? "general";
  const planTier = (payload.planTier as PlanTier) ?? "basic";
  const variant = resolveTemplateVariant({
    documentType: "protocol",
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

  // ── Reception date ──
  receptionDateRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  receptionDateCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER_DEFAULT,
    borderRadius: 6,
    padding: 10,
  },
  receptionDateLabel: {
    fontSize: 7,
    color: TEXT_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  receptionDateValue: {
    fontSize: 10,
    fontFamily: MONO,
    color: TEXT_PRIMARY,
  },

  // ── Table ──
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
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  tableHeaderCell: {
    fontSize: 7.5,
    fontFamily: BODY,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER_SUBTLE,
  },
  tableCellLp: {
    width: 30,
    fontSize: 9,
    fontFamily: MONO,
  },
  tableCellDesc: {
    flex: 1,
    fontSize: 9.5,
    paddingRight: 8,
  },
  tableCellStatus: {
    width: 80,
    fontSize: 9.5,
    textAlign: "center",
  },
  tableCellNotes: {
    width: 120,
    fontSize: 8.5,
    color: TEXT_SECONDARY,
  },

  // ── Notes section ──
  sectionText: {
    fontSize: 9.5,
    color: TEXT_PRIMARY,
    lineHeight: 1.6,
  },

  // ── Empty state ──
  emptyState: {
    padding: 16,
    textAlign: "center",
    color: TEXT_MUTED,
    fontSize: 9,
    fontStyle: "italic",
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

interface ProtocolLabels {
  title: string;
  contractor: string;
  client: string;
  receptionDate: string;
  itemsSection: string;
  colLp: string;
  colDescription: string;
  colStatus: string;
  colNotes: string;
  accepted: string;
  rejected: string;
  notes: string;
  noItems: string;
  sigContractor: string;
  sigClient: string;
  footerGenerated: string;
  footerPage: (n: number, total: number) => string;
}

const LABELS: Record<string, ProtocolLabels> = {
  pl: {
    title: "PROTOK\u00D3\u0141 ODBIORU ROB\u00D3T",
    contractor: "WYKONAWCA",
    client: "ZLECENIODAWCA",
    receptionDate: "DATA ODBIORU",
    itemsSection: "POZYCJE DO ODBIORU",
    colLp: "Lp.",
    colDescription: "Opis",
    colStatus: "Wynik",
    colNotes: "Uwagi",
    accepted: "Przyj\u0119to",
    rejected: "Odrzucono",
    notes: "UWAGI OG\u00D3LNE",
    noItems: "Brak pozycji do odbioru",
    sigContractor: "Podpis wykonawcy",
    sigClient: "Podpis zleceniodawcy",
    footerGenerated: "Wygenerowano",
    footerPage: (n, total) => `Strona ${n} / ${total}`,
  },
  en: {
    title: "WORK ACCEPTANCE PROTOCOL",
    contractor: "CONTRACTOR",
    client: "CLIENT",
    receptionDate: "RECEPTION DATE",
    itemsSection: "ITEMS FOR ACCEPTANCE",
    colLp: "No.",
    colDescription: "Description",
    colStatus: "Result",
    colNotes: "Notes",
    accepted: "Accepted",
    rejected: "Rejected",
    notes: "GENERAL NOTES",
    noItems: "No items for acceptance",
    sigContractor: "Contractor signature",
    sigClient: "Client signature",
    footerGenerated: "Generated",
    footerPage: (n, total) => `Page ${n} / ${total}`,
  },
  uk: {
    title: "\u041F\u0420\u041E\u0422\u041E\u041A\u041E\u041B \u041F\u0420\u0418\u0419\u041E\u041C\u041A\u0418 \u0420\u041E\u0411\u0406\u0422",
    contractor: "\u0412\u0418\u041A\u041E\u041D\u0410\u0412\u0415\u0426\u042C",
    client: "\u0417\u0410\u041C\u041E\u0412\u041D\u0418\u041A",
    receptionDate: "\u0414\u0410\u0422\u0410 \u041F\u0420\u0418\u0419\u041E\u041C\u041A\u0418",
    itemsSection: "\u041F\u041E\u0417\u0418\u0426\u0406\u0407 \u0414\u041B\u042F \u041F\u0420\u0418\u0419\u041E\u041C\u041A\u0418",
    colLp: "\u2116",
    colDescription: "\u041E\u043F\u0438\u0441",
    colStatus: "\u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442",
    colNotes: "\u041F\u0440\u0438\u043C\u0456\u0442\u043A\u0438",
    accepted: "\u041F\u0440\u0438\u0439\u043D\u044F\u0442\u043E",
    rejected: "\u0412\u0456\u0434\u0445\u0438\u043B\u0435\u043D\u043E",
    notes: "\u0417\u0410\u0413\u0410\u041B\u042C\u041D\u0406 \u041F\u0420\u0418\u041C\u0406\u0422\u041A\u0418",
    noItems: "\u041D\u0435\u043C\u0430\u0454 \u043F\u043E\u0437\u0438\u0446\u0456\u0439 \u0434\u043B\u044F \u043F\u0440\u0438\u0439\u043E\u043C\u043A\u0438",
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

function getProtocolLabels(locale?: string): ProtocolLabels {
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
  labels: ProtocolLabels,
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
  labels: ProtocolLabels,
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

function buildReceptionDate(
  section: ProtocolDocumentSection,
  labels: ProtocolLabels,
  locale?: string,
) {
  return e(
    View,
    { style: styles.receptionDateRow },
    e(
      View,
      { style: styles.receptionDateCard },
      e(Text, { style: styles.receptionDateLabel }, labels.receptionDate),
      e(Text, { style: styles.receptionDateValue }, formatDate(section.receptionDate, locale)),
    ),
  );
}

function buildItemsTable(
  section: ProtocolDocumentSection,
  labels: ProtocolLabels,
  tokens: BaseStyleTokens,
) {
  const items: ProtocolItem[] = section.items ?? [];

  const headerRow = e(
    View,
    {
      style: [
        styles.tableHeader,
        {
          backgroundColor: tokens.tableHeaderBg,
          borderBottomColor: tokens.sectionAccent,
        },
      ],
    },
    e(Text, { style: [styles.tableHeaderCell, styles.tableCellLp, { color: tokens.tableHeaderText }] }, labels.colLp),
    e(Text, { style: [styles.tableHeaderCell, styles.tableCellDesc, { color: tokens.tableHeaderText }] }, labels.colDescription),
    e(Text, { style: [styles.tableHeaderCell, styles.tableCellStatus, { color: tokens.tableHeaderText }] }, labels.colStatus),
    e(Text, { style: [styles.tableHeaderCell, styles.tableCellNotes, { color: tokens.tableHeaderText }] }, labels.colNotes),
  );

  const dataRows = items.length > 0
    ? items.map((item, idx) => {
        const rowBg = item.accepted ? ROW_ACCEPTED_BG : ROW_REJECTED_BG;
        const statusIcon = item.accepted ? "\u2713" : "\u2717";
        const statusColor = item.accepted ? STATE_SUCCESS : STATE_ERROR;
        const statusText = item.accepted ? labels.accepted : labels.rejected;

        return e(
          View,
          { key: `row-${idx}`, style: [styles.tableRow, { backgroundColor: rowBg }] },
          e(Text, { style: styles.tableCellLp }, String(idx + 1)),
          e(Text, { style: styles.tableCellDesc }, item.description),
          e(Text, { style: [styles.tableCellStatus, { color: statusColor, fontWeight: "bold" }] }, `${statusIcon} ${statusText}`),
          e(Text, { style: styles.tableCellNotes }, item.notes ?? ""),
        );
      })
    : [e(Text, { key: "empty", style: styles.emptyState }, labels.noItems)];

  return e(
    View,
    { style: styles.sectionContainer },
    buildSectionLabelWithAccent(labels.itemsSection, tokens),
    headerRow,
    ...dataRows,
  );
}

function buildNotesSection(
  section: ProtocolDocumentSection,
  labels: ProtocolLabels,
  tokens: BaseStyleTokens,
) {
  if (!section.notes) return null;
  return e(
    View,
    { style: styles.sectionContainer },
    buildSectionLabelWithAccent(labels.notes, tokens),
    e(Text, { style: styles.sectionText }, section.notes),
  );
}

function buildSignatures(labels: ProtocolLabels) {
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
  labels: ProtocolLabels,
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

export function buildProtocolDocument(
  payload: UnifiedDocumentPayload,
): unknown {
  const section = payload.section as ProtocolDocumentSection;
  const labels = getProtocolLabels(payload.locale);
  const tokens = resolveProtocolTokens(payload);

  const pageContent: any[] = [
    buildHeader(payload, labels, tokens),
    buildInfoCards(payload, labels),
    buildReceptionDate(section, labels, payload.locale),
    buildItemsTable(section, labels, tokens),
    buildNotesSection(section, labels, tokens),
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
 * Renderuje protok\u00F3\u0142 odbioru rob\u00F3t z UnifiedDocumentPayload v2 do binarnego PDF.
 *
 * @param payload - UnifiedDocumentPayload z documentType === 'protocol'
 * @returns Uint8Array z zawarto\u015Bci\u0105 PDF
 * @throws je\u015Bli section.type nie jest 'protocol' lub renderowanie si\u0119 nie powiod\u0142o
 */
export async function renderProtocolFromV2Payload(
  payload: UnifiedDocumentPayload,
): Promise<Uint8Array> {
  if (payload.section.type !== "protocol") {
    throw new Error(
      `renderProtocolFromV2Payload: oczekiwano section.type='protocol', otrzymano '${payload.section.type}'.`,
    );
  }

  const doc = buildProtocolDocument(payload);
  const buffer = await renderToBuffer(doc as any);
  return new Uint8Array(buffer);
}
