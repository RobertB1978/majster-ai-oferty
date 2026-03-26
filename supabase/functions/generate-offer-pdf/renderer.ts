/**
 * generate-offer-pdf — PDF renderer (minimal scaffold).
 *
 * PR 2/5 delivers a working but basic layout.
 * PR 3/5 will replace this with the full prestige A4 template
 * using design tokens (roadmap §26 sekcja 3.1–3.4).
 *
 * Uses @react-pdf/renderer via npm: specifier (Deno npm compatibility).
 * React.createElement is used instead of JSX to avoid requiring a
 * deno.json jsxImportSource configuration.
 *
 * Roadmap §26 PDF Migration — PR 2 (Edge Function).
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
import type { OfferPDFPayload } from "./types.ts";

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    backgroundColor: "#FFFFFF",
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E4DC",
    paddingBottom: 12,
  },
  docId: {
    fontSize: 8,
    color: "#6B7280",
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 4,
  },
  projectName: {
    fontSize: 12,
    color: "#374151",
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 8,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  sectionValue: {
    fontSize: 10,
    color: "#111827",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F5F3EF",
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginBottom: 2,
    borderRadius: 2,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F0EDE8",
  },
  colName: { flex: 3, fontSize: 9, color: "#374151" },
  colQty: { flex: 1, fontSize: 9, color: "#374151", textAlign: "right" },
  colPrice: { flex: 1.5, fontSize: 9, color: "#374151", textAlign: "right" },
  colTotal: { flex: 1.5, fontSize: 9, color: "#374151", textAlign: "right" },
  totalsBox: {
    marginTop: 12,
    alignSelf: "flex-end",
    width: 220,
    borderTopWidth: 1,
    borderTopColor: "#E8E4DC",
    paddingTop: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  totalLabel: { fontSize: 9, color: "#6B7280" },
  totalValue: { fontSize: 9, color: "#374151", fontFamily: "Courier" },
  grandTotalLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  grandTotalValue: {
    fontSize: 11,
    fontFamily: "Courier-Bold",
    color: "#D97706",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: "#E8E4DC",
    paddingTop: 6,
  },
  footerText: { fontSize: 8, color: "#9CA3AF" },
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
    return new Date(iso).toLocaleDateString("pl-PL");
  } catch {
    return iso;
  }
}

// ── Document factory ──────────────────────────────────────────────────────────

function e(type: any, props: any, ...children: any[]): any {
  return React.createElement(type, props, ...children);
}

function buildPositionsTable(quote: NonNullable<OfferPDFPayload["quote"]>) {
  const rows = quote.positions.map((pos) =>
    e(View, { key: pos.id, style: styles.tableRow },
      e(Text, { style: styles.colName }, pos.name),
      e(Text, { style: styles.colQty }, `${pos.qty} ${pos.unit}`),
      e(Text, { style: styles.colPrice }, formatPLN(pos.price)),
      e(Text, { style: styles.colTotal }, formatPLN(pos.qty * pos.price)),
    )
  );

  return e(View, { style: styles.section },
    e(Text, { style: styles.sectionLabel }, "Pozycje"),
    e(View, { style: styles.tableHeader },
      e(Text, { style: styles.colName }, "Nazwa"),
      e(Text, { style: styles.colQty }, "Ilość"),
      e(Text, { style: styles.colPrice }, "Cena jedn."),
      e(Text, { style: styles.colTotal }, "Wartość"),
    ),
    ...rows,
  );
}

function buildTotals(quote: NonNullable<OfferPDFPayload["quote"]>) {
  const vatLine = quote.isVatExempt
    ? e(View, { style: styles.totalRow },
        e(Text, { style: styles.totalLabel }, "VAT"),
        e(Text, { style: styles.totalValue }, "zw."),
      )
    : e(View, { style: styles.totalRow },
        e(Text, { style: styles.totalLabel }, `VAT ${quote.vatRate ?? 0}%`),
        e(Text, { style: styles.totalValue }, formatPLN(quote.vatAmount)),
      );

  return e(View, { style: styles.totalsBox },
    e(View, { style: styles.totalRow },
      e(Text, { style: styles.totalLabel }, "Netto"),
      e(Text, { style: styles.totalValue }, formatPLN(quote.netTotal)),
    ),
    vatLine,
    e(View, { style: styles.totalRow },
      e(Text, { style: styles.grandTotalLabel }, "Razem brutto"),
      e(Text, { style: styles.grandTotalValue }, formatPLN(quote.grossTotal)),
    ),
  );
}

/**
 * Build the @react-pdf/renderer Document element for the given payload.
 * Returns a React element tree (no JSX — pure createElement calls).
 */
export function buildPdfDocument(payload: OfferPDFPayload): unknown {
  const { company, client, quote, documentId, issuedAt, validUntil, projectName, pdfConfig } = payload;

  const companyAddress = [company.street, company.city].filter(Boolean).join(", ");

  return e(Document, { title: `${pdfConfig.title} — ${documentId}` },
    e(Page, { size: "A4", style: styles.page },

      // Header
      e(View, { style: styles.header },
        e(Text, { style: styles.docId }, documentId),
        e(Text, { style: styles.title }, pdfConfig.title),
        e(Text, { style: styles.projectName }, projectName),
      ),

      // Company + Client row
      e(View, { style: { flexDirection: "row", marginBottom: 20, gap: 24 } },
        e(View, { style: { flex: 1 } },
          e(Text, { style: styles.sectionLabel }, "Wystawca"),
          e(Text, { style: styles.sectionValue }, company.name),
          company.nip ? e(Text, { style: styles.sectionValue }, `NIP: ${company.nip}`) : null,
          companyAddress ? e(Text, { style: styles.sectionValue }, companyAddress) : null,
          company.phone ? e(Text, { style: styles.sectionValue }, company.phone) : null,
        ),
        client
          ? e(View, { style: { flex: 1 } },
              e(Text, { style: styles.sectionLabel }, "Dla"),
              e(Text, { style: styles.sectionValue }, client.name),
              client.phone ? e(Text, { style: styles.sectionValue }, client.phone) : null,
              client.email ? e(Text, { style: styles.sectionValue }, client.email) : null,
            )
          : null,
      ),

      // Dates
      e(View, { style: { flexDirection: "row", marginBottom: 20, gap: 24 } },
        e(View, { style: { flex: 1 } },
          e(Text, { style: styles.sectionLabel }, "Data wystawienia"),
          e(Text, { style: styles.sectionValue }, formatDate(issuedAt)),
        ),
        e(View, { style: { flex: 1 } },
          e(Text, { style: styles.sectionLabel }, "Ważna do"),
          e(Text, { style: styles.sectionValue }, formatDate(validUntil)),
        ),
      ),

      // Positions table + totals
      quote ? buildPositionsTable(quote) : null,
      quote ? buildTotals(quote) : null,

      // Footer
      e(View, { style: styles.footer },
        e(Text, { style: styles.footerText }, company.name),
        e(Text, { style: styles.footerText },
          `Wygenerowano: ${formatDate(payload.generatedAt)}`,
        ),
      ),
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
