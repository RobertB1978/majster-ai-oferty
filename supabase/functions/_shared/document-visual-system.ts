/**
 * Document Visual System v2 — Lustro Deno (Edge Functions)
 *
 * KANONICZNE ŹRÓDŁO LOGIKI WIZUALNEJ DLA ŚRODOWISKA DENO.
 * Lustrzane odbicie src/lib/pdf/documentVisualSystem.ts (frontend).
 *
 * DLACZEGO DWA PLIKI:
 *   - documentVisualSystem.ts: importuje typy z @/types/unified-document-payload
 *     (ścieżka TS/Vite — działa w środowisku Node/browser)
 *   - ten plik: samodzielny, bez importów zewnętrznych (Deno ESM, Edge Functions)
 *
 *   Logika rozwiązywania wariantów jest IDENTYCZNA w obu plikach.
 *   Zmiana tutaj MUSI być zsynchronizowana z plikiem frontend.
 *
 * Roadmap: PDF Platform v2 — Document Visual System.
 */

// ── Typy lokalne (mirror z unified-document-payload.ts) ───────────────────────

export type DocumentType =
  | "offer"
  | "contract"
  | "protocol"
  | "warranty"
  | "inspection";

export type TradeType =
  | "general"
  | "electrical"
  | "plumbing"
  | "tiling"
  | "painting"
  | "carpentry"
  | "roofing"
  | "hvac"
  | "masonry"
  | "flooring";

export type PlanTier = "free" | "basic" | "pro" | "enterprise";

// ── Typy systemu wizualnego ────────────────────────────────────────────────────

export type VisualBaseStyle = "classic" | "technical" | "premium";

export interface VisualFeatureFlags {
  showLogo: boolean;
  showQrCode: boolean;
  showWatermark: boolean;
  headerStyle: "minimal" | "standard" | "branded";
}

export interface TradeAccentColors {
  primary: string;
  subtleBg: string;
}

export interface TemplateVariant {
  baseStyle: VisualBaseStyle;
  tradeAccent: TradeAccentColors;
  features: VisualFeatureFlags;
  readonly variantKey: string;
}

export interface BaseStyleTokens {
  headerBg: string;
  headerText: string;
  sectionAccent: string;
  accentStripeBg: string;
  tableAltRowBg: string;
  tableHeaderBg: string;
  tableHeaderText: string;
  summaryBg: string;
  grossAccent: string;
  tableTheme: "grid" | "striped" | "plain";
}

// ── Mapowanie akcentów branżowych ─────────────────────────────────────────────

const TRADE_ACCENT_MAP: Record<TradeType, TradeAccentColors> = {
  general:    { primary: "#F59E0B", subtleBg: "#FFFBEB" },
  electrical: { primary: "#F59E0B", subtleBg: "#FFFBEB" },
  plumbing:   { primary: "#1D4ED8", subtleBg: "#EFF6FF" },
  tiling:     { primary: "#92400E", subtleBg: "#FEF3C7" },
  painting:   { primary: "#D97706", subtleBg: "#FFFBEB" },
  carpentry:  { primary: "#92400E", subtleBg: "#FEF3C7" },
  roofing:    { primary: "#374151", subtleBg: "#F9FAFB" },
  hvac:       { primary: "#1E40AF", subtleBg: "#EFF6FF" },
  masonry:    { primary: "#78350F", subtleBg: "#FEF3C7" },
  flooring:   { primary: "#92400E", subtleBg: "#FEF3C7" },
};

// ── Tokeny bazowych stylów ────────────────────────────────────────────────────

export const BASE_STYLE_TOKENS: Record<VisualBaseStyle, BaseStyleTokens> = {
  classic: {
    headerBg:        "#111827",
    headerText:      "#FFFFFF",
    sectionAccent:   "#111827",
    accentStripeBg:  "#FEF3C7",
    tableAltRowBg:   "#F8FAFC",
    tableHeaderBg:   "#111827",
    tableHeaderText: "#FFFFFF",
    summaryBg:       "#FFFBEB",
    grossAccent:     "#B45309",
    tableTheme:      "grid",
  },
  technical: {
    headerBg:        "#1E3A5F",
    headerText:      "#FFFFFF",
    sectionAccent:   "#1E40AF",
    accentStripeBg:  "#EFF6FF",
    tableAltRowBg:   "#F0F7FF",
    tableHeaderBg:   "#1E3A5F",
    tableHeaderText: "#FFFFFF",
    summaryBg:       "#EFF6FF",
    grossAccent:     "#1E40AF",
    tableTheme:      "striped",
  },
  premium: {
    headerBg:        "#0F172A",
    headerText:      "#FFFFFF",
    sectionAccent:   "#D97706",
    accentStripeBg:  "#FFFBEB",
    tableAltRowBg:   "#FAFAF8",
    tableHeaderBg:   "#0F172A",
    tableHeaderText: "#FFFFFF",
    summaryBg:       "#FFFBEB",
    grossAccent:     "#92400E",
    tableTheme:      "plain",
  },
};

// ── Logika rozwiązywania ──────────────────────────────────────────────────────

function resolveBaseStyle(
  documentType: DocumentType,
  planTier: PlanTier,
): VisualBaseStyle {
  if (planTier === "free" || planTier === "basic") {
    return "classic";
  }

  switch (documentType) {
    case "offer":
    case "contract":
      return "premium";
    case "protocol":
    case "inspection":
      return "technical";
    case "warranty":
      return "classic";
    default:
      return "classic";
  }
}

function resolveFeatureFlags(planTier: PlanTier): VisualFeatureFlags {
  const isPremium = planTier === "pro" || planTier === "enterprise";
  const isFree = planTier === "free";

  return {
    showLogo:     !isFree,
    showQrCode:   !isFree,
    showWatermark: isFree,
    headerStyle:  isFree ? "minimal" : isPremium ? "branded" : "standard",
  };
}

function resolveTradeAccent(trade: TradeType): TradeAccentColors {
  return TRADE_ACCENT_MAP[trade] ?? TRADE_ACCENT_MAP["general"];
}

// ── Funkcje publiczne ─────────────────────────────────────────────────────────

export interface TemplateResolutionInput {
  documentType: DocumentType;
  trade: TradeType;
  planTier: PlanTier;
}

/**
 * Automatycznie rozwiązuje wariant szablonu wizualnego.
 *
 * Klient NIGDY nie wybiera stylu ręcznie.
 * Fallback: nieznana branża → general, nieznany typ → classic.
 */
export function resolveTemplateVariant(
  input: TemplateResolutionInput,
): TemplateVariant {
  const { documentType, trade, planTier } = input;

  const baseStyle   = resolveBaseStyle(documentType, planTier);
  const tradeAccent = resolveTradeAccent(trade);
  const features    = resolveFeatureFlags(planTier);

  const variantKey = `${baseStyle}:${trade}:${planTier}:${documentType}`;

  return { baseStyle, tradeAccent, features, variantKey };
}

/**
 * Scala tokeny stylu bazowego z akcentem branżowym.
 * Nadpisuje TYLKO sectionAccent i accentStripeBg.
 */
export function mergeStyleWithTradeAccent(
  baseStyle: VisualBaseStyle,
  tradeAccent: TradeAccentColors,
): BaseStyleTokens {
  const base = BASE_STYLE_TOKENS[baseStyle];
  return {
    ...base,
    sectionAccent:  tradeAccent.primary,
    accentStripeBg: tradeAccent.subtleBg,
  };
}

/**
 * Kompletne tokeny kolorów dla danego wariantu szablonu.
 */
export function getStyleTokens(variant: TemplateVariant): BaseStyleTokens {
  return mergeStyleWithTradeAccent(variant.baseStyle, variant.tradeAccent);
}
