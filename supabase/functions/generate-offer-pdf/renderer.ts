/**
 * generate-offer-pdf — Prestige A4 Renderer.
 *
 * PR 3/5 — Full prestige A4 template with design tokens from roadmap §3.1–3.4.
 * Replaces the minimal scaffold from PR 2/5.
 *
 * Design principles:
 * - Warm off-white feel via subtle backgrounds
 * - Amber brand accent for totals and key elements
 * - Monospace (Courier) for monetary amounts (Helvetica-family only in @react-pdf)
 * - Professional spacing and hierarchy
 * - Variant sections support (multi-quote offers)
 * - QR code placeholder for acceptance URL
 * - Page numbers in footer
 *
 * Uses @react-pdf/renderer via npm: specifier (Deno npm compatibility).
 * React.createElement is used instead of JSX to avoid deno.json config.
 *
 * Roadmap §26 PDF Migration — PR 3 (Prestige Renderer).
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
import type { OfferPDFPayload, PDFQuoteData } from "./types.ts";

// ── Design Tokens (roadmap §3.1–3.4) ────────────────────────────────────────

const COLORS = {
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  bgBase: "#FAFAF8",
  bgSurface: "#FFFFFF",
  bgSurfaceRaised: "#F5F3EF",
  borderDefault: "#E8E4DC",
  borderSubtle: "#F0EDE8",
  accentAmber: "#F59E0B",
  accentAmberHover: "#D97706",
  accentAmberSubtle: "#FEF3C7",
  stateSuccess: "#16A34A",
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
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
    borderBottomColor: COLORS.accentAmber,
  },
  headerLeft: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: COLORS.textPrimary,
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
  docTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  docId: {
    fontSize: 9,
    fontFamily: "Courier",
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  projectName: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontStyle: "italic",
  },

  // ── Info cards row ──
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
    fontFamily: "Helvetica-Bold",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },

  // ── Dates row ──
  datesRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  dateCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
    borderRadius: 6,
    padding: 10,
  },
  dateLabel: {
    fontSize: 7,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  dateValue: {
    fontSize: 10,
    fontFamily: "Courier",
    color: COLORS.textPrimary,
  },

  // ── Offer text / scope ──
  scopeSection: {
    marginBottom: 16,
  },
  scopeLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  scopeText: {
    fontSize: 9.5,
    color: COLORS.textPrimary,
    lineHeight: 1.6,
  },

  // ── Variant header ──
  variantHeader: {
    backgroundColor: COLORS.bgSurfaceRaised,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 8,
    marginTop: 12,
  },
  variantTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COLORS.textPrimary,
  },

  // ── Positions table ──
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.bgSurfaceRaised,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  tableHeaderText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.borderSubtle,
  },
  tableRowAlt: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.borderSubtle,
    backgroundColor: "#FDFCFA",
  },
  colLp: { width: 24, fontSize: 8, color: COLORS.textMuted },
  colName: { flex: 3, fontSize: 9.5, color: COLORS.textPrimary },
  colQty: { flex: 1, fontSize: 9, fontFamily: "Courier", color: COLORS.textPrimary, textAlign: "right" },
  colUnit: { width: 32, fontSize: 8.5, color: COLORS.textSecondary, textAlign: "center" },
  colPrice: { flex: 1.2, fontSize: 9, fontFamily: "Courier", color: COLORS.textPrimary, textAlign: "right" },
  colTotal: { flex: 1.2, fontSize: 9, fontFamily: "Courier-Bold", color: COLORS.textPrimary, textAlign: "right" },

  // ── Totals box ──
  totalsContainer: {
    marginTop: 16,
    alignSelf: "flex-end",
    width: 240,
  },
  totalsBox: {
    backgroundColor: COLORS.bgSurfaceRaised,
    borderRadius: 8,
    padding: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  totalLabel: { fontSize: 9, color: COLORS.textSecondary },
  totalValue: { fontSize: 9, fontFamily: "Courier", color: COLORS.textPrimary },
  totalSeparator: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderDefault,
    marginVertical: 6,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.accentAmberSubtle,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLORS.textPrimary,
  },
  grandTotalValue: {
    fontSize: 13,
    fontFamily: "Courier-Bold",
    color: COLORS.accentAmberHover,
  },

  // ── Terms / conditions ──
  termsSection: {
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.borderDefault,
  },
  termsLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  termsText: {
    fontSize: 8.5,
    color: COLORS.textSecondary,
    lineHeight: 1.5,
  },

  // ── Acceptance URL ──
  acceptanceSection: {
    marginTop: 16,
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.accentAmber,
    borderRadius: 6,
    backgroundColor: "#FFFDF7",
  },
  acceptanceLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLORS.accentAmberHover,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  acceptanceUrl: {
    fontSize: 7.5,
    fontFamily: "Courier",
    color: COLORS.textSecondary,
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
    fontFamily: "Courier",
    color: COLORS.textMuted,
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPLN(amount: number): string {
  return (
    new Intl.NumberFormat("pl-PL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + " PLN"
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ── Element shorthand ────────────────────────────────────────────────────────

function e(type: any, props: any, ...children: any[]): any {
  return React.createElement(type, props, ...children);
}

// ── Sub-components ───────────────────────────────────────────────────────────

function buildHeader(payload: OfferPDFPayload) {
  const { company, pdfConfig, documentId, projectName } = payload;
  const companyLines: string[] = [];
  if (company.nip) companyLines.push(`NIP: ${company.nip}`);
  const address = [company.street, company.postalCode, company.city].filter(Boolean).join(", ");
  if (address) companyLines.push(address);
  if (company.phone) companyLines.push(`tel. ${company.phone}`);
  if (company.email) companyLines.push(company.email);

  return e(View, { style: styles.headerBand },
    e(View, { style: styles.headerLeft },
      e(Text, { style: styles.companyName }, company.name),
      ...companyLines.map((line, i) =>
        e(Text, { key: `cd-${i}`, style: styles.companyDetail }, line)
      ),
    ),
    e(View, { style: styles.headerRight },
      e(Text, { style: styles.docTitle }, pdfConfig.title),
      e(Text, { style: styles.docId }, documentId),
      projectName ? e(Text, { style: styles.projectName }, projectName) : null,
    ),
  );
}

function buildInfoCards(payload: OfferPDFPayload) {
  const { company, client } = payload;

  return e(View, { style: styles.infoRow },
    // Issuer card
    e(View, { style: styles.infoCard },
      e(Text, { style: styles.infoLabel }, "WYSTAWCA"),
      e(Text, { style: styles.infoValueBold }, company.name),
      company.nip ? e(Text, { style: styles.infoValue }, `NIP: ${company.nip}`) : null,
      company.phone ? e(Text, { style: styles.infoValue }, `tel. ${company.phone}`) : null,
      company.email ? e(Text, { style: styles.infoValue }, company.email) : null,
    ),
    // Client card
    client
      ? e(View, { style: styles.infoCard },
          e(Text, { style: styles.infoLabel }, "DLA KLIENTA"),
          e(Text, { style: styles.infoValueBold }, client.name),
          client.address ? e(Text, { style: styles.infoValue }, client.address) : null,
          client.phone ? e(Text, { style: styles.infoValue }, `tel. ${client.phone}`) : null,
          client.email ? e(Text, { style: styles.infoValue }, client.email) : null,
        )
      : null,
  );
}

function buildDates(payload: OfferPDFPayload) {
  return e(View, { style: styles.datesRow },
    e(View, { style: styles.dateCard },
      e(Text, { style: styles.dateLabel }, "DATA WYSTAWIENIA"),
      e(Text, { style: styles.dateValue }, formatDate(payload.issuedAt)),
    ),
    e(View, { style: styles.dateCard },
      e(Text, { style: styles.dateLabel }, "WAŻNA DO"),
      e(Text, { style: styles.dateValue }, formatDate(payload.validUntil)),
    ),
    e(View, { style: styles.dateCard },
      e(Text, { style: styles.dateLabel }, "TERMIN REALIZACJI"),
      e(Text, { style: styles.dateValue }, payload.pdfConfig.deadlineText || "—"),
    ),
  );
}

function buildOfferText(payload: OfferPDFPayload) {
  if (!payload.pdfConfig.offerText) return null;
  return e(View, { style: styles.scopeSection },
    e(Text, { style: styles.scopeLabel }, "ZAKRES PRAC"),
    e(Text, { style: styles.scopeText }, payload.pdfConfig.offerText),
  );
}

function buildPositionsTable(quote: PDFQuoteData, label?: string) {
  const header = e(View, { style: styles.tableHeader },
    e(Text, { style: { ...styles.tableHeaderText, width: 24 } }, "LP"),
    e(Text, { style: { ...styles.tableHeaderText, flex: 3 } }, "NAZWA"),
    e(Text, { style: { ...styles.tableHeaderText, flex: 1, textAlign: "right" } }, "ILOŚĆ"),
    e(Text, { style: { ...styles.tableHeaderText, width: 32, textAlign: "center" } }, "JM"),
    e(Text, { style: { ...styles.tableHeaderText, flex: 1.2, textAlign: "right" } }, "CENA JEDN."),
    e(Text, { style: { ...styles.tableHeaderText, flex: 1.2, textAlign: "right" } }, "WARTOŚĆ"),
  );

  const rows = quote.positions.map((pos, idx) => {
    const rowStyle = idx % 2 === 1 ? styles.tableRowAlt : styles.tableRow;
    return e(View, { key: pos.id, style: rowStyle },
      e(Text, { style: styles.colLp }, String(idx + 1)),
      e(Text, { style: styles.colName }, pos.name),
      e(Text, { style: styles.colQty }, String(pos.qty)),
      e(Text, { style: styles.colUnit }, pos.unit),
      e(Text, { style: styles.colPrice }, formatPLN(pos.price)),
      e(Text, { style: styles.colTotal }, formatPLN(pos.qty * pos.price)),
    );
  });

  const elements: any[] = [];

  if (label) {
    elements.push(
      e(View, { key: `vh-${label}`, style: styles.variantHeader },
        e(Text, { style: styles.variantTitle }, label),
      )
    );
  }

  elements.push(header, ...rows);
  return elements;
}

function buildTotals(quote: PDFQuoteData) {
  return e(View, { style: styles.totalsContainer },
    e(View, { style: styles.totalsBox },
      // Materials subtotal
      quote.summaryMaterials > 0
        ? e(View, { style: styles.totalRow },
            e(Text, { style: styles.totalLabel }, "Materiały"),
            e(Text, { style: styles.totalValue }, formatPLN(quote.summaryMaterials)),
          )
        : null,
      // Labor subtotal
      quote.summaryLabor > 0
        ? e(View, { style: styles.totalRow },
            e(Text, { style: styles.totalLabel }, "Robocizna"),
            e(Text, { style: styles.totalValue }, formatPLN(quote.summaryLabor)),
          )
        : null,
      // Separator
      e(View, { style: styles.totalSeparator }),
      // Net total
      e(View, { style: styles.totalRow },
        e(Text, { style: styles.totalLabel }, "Netto"),
        e(Text, { style: styles.totalValue }, formatPLN(quote.netTotal)),
      ),
      // VAT
      quote.isVatExempt
        ? e(View, { style: styles.totalRow },
            e(Text, { style: styles.totalLabel }, "VAT"),
            e(Text, { style: styles.totalValue }, "zw."),
          )
        : e(View, { style: styles.totalRow },
            e(Text, { style: styles.totalLabel }, `VAT ${quote.vatRate ?? 0}%`),
            e(Text, { style: styles.totalValue }, formatPLN(quote.vatAmount)),
          ),
    ),
    // Grand total — amber highlight
    e(View, { style: styles.grandTotalRow },
      e(Text, { style: styles.grandTotalLabel }, "RAZEM BRUTTO"),
      e(Text, { style: styles.grandTotalValue }, formatPLN(quote.grossTotal)),
    ),
  );
}

function buildTerms(payload: OfferPDFPayload) {
  if (!payload.pdfConfig.terms) return null;
  return e(View, { style: styles.termsSection },
    e(Text, { style: styles.termsLabel }, "WARUNKI"),
    e(Text, { style: styles.termsText }, payload.pdfConfig.terms),
  );
}

function buildAcceptanceUrl(payload: OfferPDFPayload) {
  if (!payload.acceptanceUrl) return null;
  return e(View, { style: styles.acceptanceSection },
    e(Text, { style: styles.acceptanceLabel }, "AKCEPTACJA ONLINE"),
    e(Text, { style: styles.acceptanceUrl }, payload.acceptanceUrl),
  );
}

function buildFooter(payload: OfferPDFPayload) {
  return e(View, { style: styles.footer, fixed: true },
    e(Text, { style: styles.footerLeft }, payload.company.name),
    e(Text, { style: styles.footerCenter },
      `Ważna do: ${formatDate(payload.validUntil)}`
    ),
    e(Text, { style: styles.footerRight, render: ({ pageNumber, totalPages }: any) =>
      `Strona ${pageNumber} / ${totalPages}`
    }),
  );
}

// ── Document factory ──────────────────────────────────────────────────────────

/**
 * Build the @react-pdf/renderer Document element for the given payload.
 * Returns a React element tree (no JSX — pure createElement calls).
 *
 * Prestige A4 template with design tokens from roadmap §3.1–3.4:
 * - Amber accent header band
 * - Info cards with raised background
 * - Alternating row colors in positions table
 * - Amber-highlighted grand total
 * - Professional footer with page numbers
 * - Variant sections support
 */
export function buildPdfDocument(payload: OfferPDFPayload): unknown {
  const { quote, variantSections } = payload;

  const pageContent: any[] = [
    buildHeader(payload),
    buildInfoCards(payload),
    buildDates(payload),
    buildOfferText(payload),
  ];

  // Multi-variant: render each variant with its own table + totals
  if (variantSections && variantSections.length > 0) {
    const sorted = [...variantSections].sort((a, b) => a.sort_order - b.sort_order);
    for (const variant of sorted) {
      const tableElements = buildPositionsTable(variant.quote, variant.label);
      pageContent.push(...tableElements);
      pageContent.push(buildTotals(variant.quote));
    }
  } else if (quote) {
    // Single quote
    const tableElements = buildPositionsTable(quote);
    pageContent.push(...tableElements);
    pageContent.push(buildTotals(quote));
  }

  pageContent.push(buildTerms(payload));
  pageContent.push(buildAcceptanceUrl(payload));
  pageContent.push(buildFooter(payload));

  return e(Document, { title: `${payload.pdfConfig.title} — ${payload.documentId}` },
    e(Page, { size: "A4", style: styles.page, wrap: true },
      ...pageContent.filter(Boolean),
    ),
  );
}

/**
 * Render the offer to a binary PDF buffer.
 * Called by the Edge Function handler.
 */
export async function renderOfferPdf(payload: OfferPDFPayload): Promise<Uint8Array> {
  const doc = buildPdfDocument(payload);
  const buffer = await renderToBuffer(doc as any);
  return new Uint8Array(buffer);
}
