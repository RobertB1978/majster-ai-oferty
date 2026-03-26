/**
 * generate-offer-pdf — Prestige A4 renderer (PR 3/5).
 *
 * Full template with design tokens (roadmap §3.1–3.4).
 * Replaces the minimal scaffold from PR 2.
 *
 * Design tokens (hex) derived from src/lib/pdf/modernPdfStyles.ts:
 *   TEXT_PRIMARY  #111827 | TEXT_SECONDARY #6B7280 | TEXT_MUTED   #9CA3AF
 *   ACCENT_AMBER  #F59E0B | AMBER_700      #D97706 | AMBER_SUBTLE #FEF3C7
 *   BG_RAISED     #F5F3EF | BORDER_DEFAULT #E8E4DC | BORDER_SUBTLE #F0EDE8
 *
 * Fonts: Helvetica (headings/body), Helvetica-Bold, Courier (amounts).
 * Full Bricolage Grotesque support planned when TTF asset is added.
 *
 * QR code: rendered via npm:qrcode if acceptanceUrl is present.
 *
 * React.createElement used instead of JSX (no deno.json jsxImportSource needed).
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
  Image,
  StyleSheet,
  renderToBuffer,
} from "npm:@react-pdf/renderer@3";
import React from "npm:react@18";
import QRCode from "npm:qrcode@1";
import type { OfferPDFPayload, PDFQuoteData, PDFOfferPosition } from "./types.ts";

// ── Color tokens ──────────────────────────────────────────────────────────────

const C = {
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  accentAmber: "#F59E0B",
  amber700: "#D97706",
  amberSubtle: "#FEF3C7",
  amberBand: "#FEF3C7",
  bgSurface: "#FFFFFF",
  bgRaised: "#F5F3EF",
  borderDefault: "#E8E4DC",
  borderSubtle: "#F0EDE8",
} as const;

// ── Styles ────────────────────────────────────────────────────────────────────

const M = 40; // page margin pt

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.textPrimary,
    backgroundColor: C.bgSurface,
    paddingTop: 0,
    paddingBottom: 56,
    paddingHorizontal: M,
  },
  topBand: {
    backgroundColor: C.amberBand,
    marginHorizontal: -M,
    paddingHorizontal: M,
    paddingVertical: 10,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  topBandLeft: { flex: 1 },
  topBandRight: { alignItems: "flex-end" },
  logoBox: {
    width: 32,
    height: 32,
    backgroundColor: C.accentAmber,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  logoInitial: { fontFamily: "Helvetica-Bold", fontSize: 16, color: "#FFFFFF" },
  companyName: { fontFamily: "Helvetica-Bold", fontSize: 13, color: C.textPrimary, marginBottom: 2 },
  companyMeta: { fontSize: 8, color: C.textSecondary, marginBottom: 1 },
  docTitle: { fontFamily: "Helvetica-Bold", fontSize: 18, color: C.textPrimary, marginBottom: 3, textAlign: "right" },
  docId: { fontSize: 9, color: C.accentAmber, fontFamily: "Courier-Bold", textAlign: "right", marginBottom: 2 },
  docDate: { fontSize: 8, color: C.textSecondary, textAlign: "right" },
  rule: { height: 1, backgroundColor: C.borderDefault, marginBottom: 16 },
  infoRow: { flexDirection: "row", marginBottom: 20, gap: 24 },
  infoCol: { flex: 1 },
  label: { fontSize: 7, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 },
  infoValue: { fontSize: 10, color: C.textPrimary, marginBottom: 1 },
  infoMeta: { fontSize: 8.5, color: C.textSecondary, marginBottom: 1 },
  tableHead: {
    flexDirection: "row",
    backgroundColor: C.bgRaised,
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 2,
    marginBottom: 1,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: C.borderSubtle,
  },
  tableRowEven: { backgroundColor: "#FAFAF9" },
  categoryRow: {
    flexDirection: "row",
    backgroundColor: C.bgRaised,
    paddingVertical: 3,
    paddingHorizontal: 6,
    marginTop: 6,
    marginBottom: 1,
  },
  categoryLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.textSecondary },
  colNo:    { width: 20, fontSize: 9, color: C.textMuted },
  colName:  { flex: 3.5, fontSize: 9, color: C.textPrimary },
  colQty:   { flex: 1, fontSize: 9, color: C.textSecondary, textAlign: "right" },
  colPrice: { flex: 1.5, fontSize: 9, color: C.textSecondary, textAlign: "right" },
  colTotal: { flex: 1.5, fontSize: 9, color: C.textPrimary, textAlign: "right" },
  colHead:  { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.textSecondary },
  totalsArea: { marginTop: 14, alignSelf: "flex-end", width: 240 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: C.borderSubtle,
  },
  totalLabel: { fontSize: 9, color: C.textSecondary },
  totalValue: { fontSize: 9, fontFamily: "Courier", color: C.textPrimary },
  grandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: C.amberSubtle,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 3,
    marginTop: 4,
  },
  grandLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.textPrimary },
  grandValue: { fontSize: 11, fontFamily: "Courier-Bold", color: C.amber700 },
  notesBox: {
    marginTop: 20,
    backgroundColor: C.bgRaised,
    padding: 10,
    borderRadius: 3,
    borderLeftWidth: 3,
    borderLeftColor: C.accentAmber,
  },
  notesLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.textSecondary, marginBottom: 4 },
  notesText: { fontSize: 9, color: C.textSecondary, lineHeight: 1.5 },
  qrBox: { width: 64, height: 64 },
  qrLabel: { fontSize: 7, color: C.textMuted, textAlign: "center", marginTop: 2 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: M,
    right: M,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: C.borderDefault,
    paddingTop: 5,
  },
  footerText: { fontSize: 8, color: C.textMuted },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(amount: number): string {
  return (
    new Intl.NumberFormat("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      .format(amount) + " PLN"
  );
}

function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString("pl-PL"); } catch { return iso; }
}

function e(type: any, props: any, ...children: any[]): any {
  return React.createElement(type, props, ...children);
}

async function buildQrDataUrl(url: string): Promise<string | null> {
  try { return await QRCode.toDataURL(url, { width: 128, margin: 1 }); } catch { return null; }
}

// ── Table helpers ─────────────────────────────────────────────────────────────

function renderGroup(label: string, items: PDFOfferPosition[], startIdx: number) {
  if (items.length === 0) return [];
  return [
    e(View, { key: `cat-${label}`, style: styles.categoryRow },
      e(Text, { style: styles.categoryLabel }, label.toUpperCase()),
    ),
    ...items.map((pos, i) =>
      e(View, {
          key: pos.id,
          style: [styles.tableRow, (startIdx + i) % 2 === 0 ? styles.tableRowEven : {}],
        },
        e(Text, { style: styles.colNo }, String(startIdx + i + 1)),
        e(Text, { style: styles.colName }, pos.name),
        e(Text, { style: styles.colQty }, `${pos.qty} ${pos.unit}`),
        e(Text, { style: styles.colPrice }, fmt(pos.price)),
        e(Text, { style: styles.colTotal }, fmt(pos.qty * pos.price)),
      )
    ),
  ];
}

function renderPositionsTable(quote: PDFQuoteData) {
  const materials = quote.positions.filter((p) => p.category === "Materiał");
  const labor = quote.positions.filter((p) => p.category === "Robocizna");

  return e(View, { style: { marginBottom: 4 } },
    e(View, { style: styles.tableHead },
      e(Text, { style: [styles.colNo, styles.colHead] }, "Lp."),
      e(Text, { style: [styles.colName, styles.colHead] }, "Pozycja"),
      e(Text, { style: [styles.colQty, styles.colHead] }, "Ilość"),
      e(Text, { style: [styles.colPrice, styles.colHead] }, "Cena jedn."),
      e(Text, { style: [styles.colTotal, styles.colHead] }, "Wartość"),
    ),
    ...renderGroup("Materiały", materials, 0),
    ...renderGroup("Robocizna", labor, materials.length),
  );
}

function renderTotals(quote: PDFQuoteData) {
  return e(View, { style: styles.totalsArea },
    e(View, { style: styles.totalRow },
      e(Text, { style: styles.totalLabel }, "Wartość netto"),
      e(Text, { style: styles.totalValue }, fmt(quote.netTotal)),
    ),
    quote.isVatExempt
      ? e(View, { style: styles.totalRow },
          e(Text, { style: styles.totalLabel }, "VAT"),
          e(Text, { style: styles.totalValue }, "zwolniony"),
        )
      : e(View, { style: styles.totalRow },
          e(Text, { style: styles.totalLabel }, `VAT ${quote.vatRate ?? 0}%`),
          e(Text, { style: styles.totalValue }, fmt(quote.vatAmount)),
        ),
    e(View, { style: styles.grandRow },
      e(Text, { style: styles.grandLabel }, "Razem do zapłaty"),
      e(Text, { style: styles.grandValue }, fmt(quote.grossTotal)),
    ),
  );
}

// ── Document factory ──────────────────────────────────────────────────────────

export function buildPdfDocument(payload: OfferPDFPayload, qrDataUrl: string | null): unknown {
  const { company, client, quote, documentId, issuedAt, validUntil, projectName, pdfConfig } = payload;
  const address = [company.street, company.city].filter(Boolean).join(", ");
  const initial = company.name.trim().charAt(0).toUpperCase() || "M";

  return e(Document, { title: `${pdfConfig.title} — ${documentId}` },
    e(Page, { size: "A4", style: styles.page },

      // Amber top band
      e(View, { style: styles.topBand },
        e(View, { style: styles.topBandLeft },
          e(View, { style: styles.logoBox },
            e(Text, { style: styles.logoInitial }, initial),
          ),
          e(Text, { style: styles.companyName }, company.name),
          company.nip ? e(Text, { style: styles.companyMeta }, `NIP: ${company.nip}`) : null,
          address ? e(Text, { style: styles.companyMeta }, address) : null,
          company.phone ? e(Text, { style: styles.companyMeta }, company.phone) : null,
          company.email ? e(Text, { style: styles.companyMeta }, company.email) : null,
        ),
        e(View, { style: styles.topBandRight },
          e(Text, { style: styles.docTitle }, pdfConfig.title),
          e(Text, { style: styles.docId }, documentId),
          e(Text, { style: styles.docDate }, `Wystawiono: ${fmtDate(issuedAt)}`),
          e(Text, { style: styles.docDate }, `Ważne do: ${fmtDate(validUntil)}`),
          qrDataUrl
            ? e(View, { style: { marginTop: 8, alignItems: "flex-end" } },
                e(Image, { style: styles.qrBox, src: qrDataUrl }),
                e(Text, { style: styles.qrLabel }, "Oferta online"),
              )
            : null,
        ),
      ),

      // Project + client
      e(View, { style: styles.infoRow },
        e(View, { style: styles.infoCol },
          e(Text, { style: styles.label }, "Projekt"),
          e(Text, { style: styles.infoValue }, projectName),
        ),
        client
          ? e(View, { style: styles.infoCol },
              e(Text, { style: styles.label }, "Klient"),
              e(Text, { style: styles.infoValue }, client.name),
              client.phone ? e(Text, { style: styles.infoMeta }, client.phone) : null,
              client.email ? e(Text, { style: styles.infoMeta }, client.email) : null,
              client.address ? e(Text, { style: styles.infoMeta }, client.address) : null,
            )
          : null,
      ),

      e(View, { style: styles.rule }),

      // Positions + totals
      quote && quote.positions.length > 0 ? renderPositionsTable(quote) : null,
      quote ? renderTotals(quote) : null,

      // Notes
      pdfConfig.offerText
        ? e(View, { style: styles.notesBox },
            e(Text, { style: styles.notesLabel }, "UWAGI"),
            e(Text, { style: styles.notesText }, pdfConfig.offerText),
          )
        : null,

      // Footer
      e(View, { style: styles.footer },
        e(Text, { style: styles.footerText }, company.name),
        e(Text, { style: styles.footerText }, documentId),
        e(Text, {
          style: styles.footerText,
          render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
            `Strona ${pageNumber} / ${totalPages}`,
        }),
      ),
    ),
  );
}

/**
 * Render the prestige A4 offer PDF to a binary buffer.
 * Called by the Edge Function handler (index.ts).
 */
export async function renderOfferPdf(payload: OfferPDFPayload): Promise<Uint8Array> {
  const qrDataUrl = payload.acceptanceUrl
    ? await buildQrDataUrl(payload.acceptanceUrl)
    : null;

  const doc = buildPdfDocument(payload, qrDataUrl);
  const buffer = await renderToBuffer(doc as any);
  return new Uint8Array(buffer);
}
