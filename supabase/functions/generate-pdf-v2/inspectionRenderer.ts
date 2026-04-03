/**
 * generate-pdf-v2 — Renderer protokołu inspekcji (@react-pdf/renderer)
 *
 * Przyjmuje UnifiedDocumentPayload (schemaVersion: 2, documentType: 'inspection')
 * i renderuje profesjonalny PDF protokołu inspekcji.
 *
 * ARCHITEKTURA:
 *   Wzorowany na protocolRenderer.ts — ten sam pipeline:
 *   UnifiedDocumentPayload → @react-pdf/renderer → binarny PDF (Uint8Array)
 *
 * SEKCJE PDF:
 *   1. Nagłówek (kolorowy pasek) — tytuł + dane firmy + numer dokumentu
 *   2. Dane stron — inspektor + zleceniodawca
 *   3. Ustalenia (findings — opcjonalne)
 *   4. Zalecenia (recommendations — opcjonalne)
 *   5. Galeria zdjęć (photos[] — opcjonalna, 2 kolumny)
 *   6. Podpisy (inspektor + zleceniodawca)
 *   7. Stopka (numer strony, data generowania, Majster.AI)
 *
 * CZCIONKI: NotoSans/NotoSansMono (polskie znaki diakrytyczne) via font-config.ts
 *
 * Roadmap: PDF Platform v2 — Inspection Canonical Renderer.
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
import type {
  UnifiedDocumentPayload,
  InspectionDocumentSection,
  InspectionPhoto,
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

function resolveInspectionTokens(payload: UnifiedDocumentPayload): BaseStyleTokens {
  const trade = (payload.trade as TradeType) ?? "general";
  const planTier = (payload.planTier as PlanTier) ?? "basic";
  const variant = resolveTemplateVariant({
    documentType: "inspection",
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

  // ── Photo gallery ──
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  photoItem: {
    width: "48%",
    marginBottom: 8,
  },
  photoImage: {
    width: "100%",
    height: 160,
    objectFit: "cover",
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: BORDER_DEFAULT,
  },
  photoCaption: {
    fontSize: 8,
    color: TEXT_SECONDARY,
    marginTop: 4,
    textAlign: "center",
    lineHeight: 1.4,
  },
  noPhotos: {
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

interface InspectionLabels {
  title: string;
  inspector: string;
  client: string;
  findings: string;
  recommendations: string;
  photoGallery: string;
  noPhotos: string;
  noFindings: string;
  noRecommendations: string;
  sigInspector: string;
  sigClient: string;
  footerGenerated: string;
  footerPage: (n: number, total: number) => string;
}

const LABELS: Record<string, InspectionLabels> = {
  pl: {
    title: "PROTOK\u00D3\u0141 INSPEKCJI",
    inspector: "INSPEKTOR",
    client: "ZLECENIODAWCA",
    findings: "USTALENIA",
    recommendations: "ZALECENIA",
    photoGallery: "DOKUMENTACJA FOTOGRAFICZNA",
    noPhotos: "Brak zdj\u0119\u0107",
    noFindings: "Brak ustale\u0144",
    noRecommendations: "Brak zalece\u0144",
    sigInspector: "Podpis inspektora",
    sigClient: "Podpis zleceniodawcy",
    footerGenerated: "Wygenerowano",
    footerPage: (n, total) => `Strona ${n} / ${total}`,
  },
  en: {
    title: "INSPECTION REPORT",
    inspector: "INSPECTOR",
    client: "CLIENT",
    findings: "FINDINGS",
    recommendations: "RECOMMENDATIONS",
    photoGallery: "PHOTO DOCUMENTATION",
    noPhotos: "No photos",
    noFindings: "No findings",
    noRecommendations: "No recommendations",
    sigInspector: "Inspector signature",
    sigClient: "Client signature",
    footerGenerated: "Generated",
    footerPage: (n, total) => `Page ${n} / ${total}`,
  },
  uk: {
    title: "\u041F\u0420\u041E\u0422\u041E\u041A\u041E\u041B \u0406\u041D\u0421\u041F\u0415\u041A\u0426\u0406\u0407",
    inspector: "\u0406\u041D\u0421\u041F\u0415\u041A\u0422\u041E\u0420",
    client: "\u0417\u0410\u041C\u041E\u0412\u041D\u0418\u041A",
    findings: "\u0412\u0418\u0421\u041D\u041E\u0412\u041A\u0418",
    recommendations: "\u0420\u0415\u041A\u041E\u041C\u0415\u041D\u0414\u0410\u0426\u0406\u0407",
    photoGallery: "\u0424\u041E\u0422\u041E\u0414\u041E\u041A\u0423\u041C\u0415\u041D\u0422\u0410\u0426\u0406\u042F",
    noPhotos: "\u041D\u0435\u043C\u0430\u0454 \u0444\u043E\u0442\u043E",
    noFindings: "\u041D\u0435\u043C\u0430\u0454 \u0432\u0438\u0441\u043D\u043E\u0432\u043A\u0456\u0432",
    noRecommendations: "\u041D\u0435\u043C\u0430\u0454 \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0456\u0439",
    sigInspector: "\u041F\u0456\u0434\u043F\u0438\u0441 \u0456\u043D\u0441\u043F\u0435\u043A\u0442\u043E\u0440\u0430",
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

function getInspectionLabels(locale?: string): InspectionLabels {
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
  labels: InspectionLabels,
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
  labels: InspectionLabels,
) {
  const { company, client } = payload;

  return e(
    View,
    { style: styles.infoRow },
    e(
      View,
      { style: styles.infoCard },
      e(Text, { style: styles.infoLabel }, labels.inspector),
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

function buildFindingsSection(
  section: InspectionDocumentSection,
  labels: InspectionLabels,
  tokens: BaseStyleTokens,
) {
  return e(
    View,
    { style: styles.sectionContainer },
    buildSectionLabelWithAccent(labels.findings, tokens),
    e(Text, { style: styles.sectionText }, section.findings ?? labels.noFindings),
  );
}

function buildRecommendationsSection(
  section: InspectionDocumentSection,
  labels: InspectionLabels,
  tokens: BaseStyleTokens,
) {
  return e(
    View,
    { style: styles.sectionContainer },
    buildSectionLabelWithAccent(labels.recommendations, tokens),
    e(Text, { style: styles.sectionText }, section.recommendations ?? labels.noRecommendations),
  );
}

function buildPhotoGallery(
  section: InspectionDocumentSection,
  labels: InspectionLabels,
  tokens: BaseStyleTokens,
) {
  const photos: InspectionPhoto[] = section.photos ?? [];

  if (photos.length === 0) {
    return e(
      View,
      { style: styles.sectionContainer },
      buildSectionLabelWithAccent(labels.photoGallery, tokens),
      e(Text, { style: styles.noPhotos }, labels.noPhotos),
    );
  }

  const photoElements = photos.map((photo, idx) =>
    e(
      View,
      { key: `photo-${idx}`, style: styles.photoItem },
      e(Image, {
        style: styles.photoImage,
        src: photo.url,
      }),
      photo.caption
        ? e(Text, { style: styles.photoCaption }, photo.caption)
        : null,
    ),
  );

  return e(
    View,
    { style: styles.sectionContainer, break: photos.length > 2 },
    buildSectionLabelWithAccent(labels.photoGallery, tokens),
    e(
      View,
      { style: styles.photoGrid },
      ...photoElements,
    ),
  );
}

function buildSignatures(labels: InspectionLabels) {
  return e(
    View,
    { style: styles.signaturesRow },
    e(
      View,
      { style: styles.signatureBlock },
      e(Text, { style: styles.signatureDots }, "..................................."),
      e(Text, { style: styles.signatureLine }, labels.sigInspector),
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
  labels: InspectionLabels,
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

export function buildInspectionDocument(
  payload: UnifiedDocumentPayload,
): unknown {
  const section = payload.section as InspectionDocumentSection;
  const labels = getInspectionLabels(payload.locale);
  const tokens = resolveInspectionTokens(payload);

  const pageContent: any[] = [
    buildHeader(payload, labels, tokens),
    buildInfoCards(payload, labels),
    buildFindingsSection(section, labels, tokens),
    buildRecommendationsSection(section, labels, tokens),
    buildPhotoGallery(section, labels, tokens),
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
 * Renderuje protok\u00F3\u0142 inspekcji z UnifiedDocumentPayload v2 do binarnego PDF.
 *
 * @param payload - UnifiedDocumentPayload z documentType === 'inspection'
 * @returns Uint8Array z zawarto\u015Bci\u0105 PDF
 * @throws je\u015Bli section.type nie jest 'inspection' lub renderowanie si\u0119 nie powiod\u0142o
 */
export async function renderInspectionFromV2Payload(
  payload: UnifiedDocumentPayload,
): Promise<Uint8Array> {
  if (payload.section.type !== "inspection") {
    throw new Error(
      `renderInspectionFromV2Payload: oczekiwano section.type='inspection', otrzymano '${payload.section.type}'.`,
    );
  }

  const doc = buildInspectionDocument(payload);
  const buffer = await renderToBuffer(doc as any);
  return new Uint8Array(buffer);
}
