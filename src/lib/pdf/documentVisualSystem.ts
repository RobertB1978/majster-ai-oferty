/**
 * Document Visual System v2 — Kanoniczne Źródło Stylistyki PDF
 *
 * ════════════════════════════════════════════════════════════════════════════
 * ⚑  Automatyczne mapowanie: documentType + trade + planTier → TemplateVariant
 *
 *    Klient NIGDY nie wybiera stylu ręcznie.
 *    System samodzielnie dobiera styl na podstawie kontekstu dokumentu.
 *
 *    Lustro Deno (Edge Functions):
 *    → supabase/functions/_shared/document-visual-system.ts
 *       (identyczna logika, typy lokalne — bez importów z src/)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * ZASADY PROJEKTOWE:
 *   - 80% spójna profesjonalna klarowność biznesowa
 *   - 20% subtelna adaptacja branżowa
 *   - A4-first, deterministyczne wyjście
 *   - Nieznana/niestandardowa branża → bezpieczny fallback (general)
 *   - Trzy bazowe style: Classic | Technical | Premium
 *
 * PRIORYTETY DOKUMENTÓW:
 *   - offer / contract   → ścieżka premium (pro/enterprise)
 *   - protocol / inspection → ścieżka techniczna (pro/enterprise)
 *   - warranty           → ścieżka classic (wszystkie plany)
 *
 * Roadmap: PDF Platform v2 — Document Visual System.
 */

import type { DocumentType, TradeType, PlanTier } from '@/types/unified-document-payload';

// ── Typy eksportowane ─────────────────────────────────────────────────────────

/** Trzy bazowe style dokumentów PDF */
export type VisualBaseStyle = 'classic' | 'technical' | 'premium';

/**
 * Flagi funkcji dostępnych w danym poziomie planu.
 * Sterują tym, co renderer wyświetla — nie jak wygląda.
 */
export interface VisualFeatureFlags {
  /** Logo firmy widoczne w nagłówku */
  showLogo: boolean;
  /** Kod QR do akceptacji / linku cyfrowego */
  showQrCode: boolean;
  /** Znak wodny "Wersja testowa" na free */
  showWatermark: boolean;
  /** Styl nagłówka strony */
  headerStyle: 'minimal' | 'standard' | 'branded';
}

/**
 * Kolory akcentu specyficzne dla branży.
 * ZASADA: zmienia się TYLKO akcent (pasek, nagłówek sekcji).
 * Typografia, układ i pozostałe tokeny są identyczne.
 */
export interface TradeAccentColors {
  /** Główny kolor akcentu branży (hex) */
  primary: string;
  /** Subtelne tło nagłówków sekcji (hex) */
  subtleBg: string;
}

/** Kompletny rozwiązany wariant szablonu wizualnego */
export interface TemplateVariant {
  /** Bazowy styl wizualny (Classic / Technical / Premium) */
  baseStyle: VisualBaseStyle;
  /** Kolory akcentu branżowego */
  tradeAccent: TradeAccentColors;
  /** Flagi funkcji */
  features: VisualFeatureFlags;
  /**
   * Klucz identyfikacyjny wariantu (do logowania i debugowania).
   * Format: `{style}:{trade}:{planTier}:{documentType}`
   * NIE jest to pole wyboru dla klienta.
   */
  readonly variantKey: string;
}

/**
 * Tokeny kolorów dla bazowego stylu.
 * Renderer scala te tokeny z `TradeAccentColors` (tylko `sectionAccent` + `accentStripeBg`).
 */
export interface BaseStyleTokens {
  /** Tło nagłówka strony (firma, tytuł dokumentu) */
  headerBg: string;
  /** Tekst w nagłówku (zawsze biały lub jasny) */
  headerText: string;
  /**
   * Kolor akcentu sekcji — nagłówki sekcji, linia dekoracyjna.
   * [TRADE_ACCENT]: zostaje nadpisane przez TradeAccentColors.primary
   */
  sectionAccent: string;
  /**
   * Subtelne tło paska akcentu (linii pod nagłówkiem, calloutów).
   * [TRADE_ACCENT]: zostaje nadpisane przez TradeAccentColors.subtleBg
   */
  accentStripeBg: string;
  /** Tło wierszy parzystych tabeli */
  tableAltRowBg: string;
  /** Tło nagłówka tabeli */
  tableHeaderBg: string;
  /** Tekst nagłówka tabeli */
  tableHeaderText: string;
  /** Tło bloku podsumowania (totals box) */
  summaryBg: string;
  /** Kolor tekstu kwoty brutto */
  grossAccent: string;
  /** Temat tabeli dla jsPDF-autotable */
  tableTheme: 'grid' | 'striped' | 'plain';
}

// ── Mapowanie akcentów branżowych ─────────────────────────────────────────────

/**
 * Subtelne dostosowanie kolorów akcentu per branża.
 *
 * WAŻNE: NIE są to zupełnie różne światy wizualne.
 * To wyłącznie 20% modyfikacja paska akcentu i tła sekcji.
 * Układ, typografia i wszystkie inne tokeny pozostają IDENTYCZNE
 * dla danego stylu bazowego — niezależnie od branży.
 *
 * Fallback dla nieznanej branży: 'general' (amber, neutralny).
 */
const TRADE_ACCENT_MAP: Record<TradeType, TradeAccentColors> = {
  // Domyślny neutralny — amber brand Majster.AI
  general:    { primary: '#F59E0B', subtleBg: '#FFFBEB' },

  // Elektryk — amber pozostaje (energia = żółty, naturalne skojarzenie)
  electrical: { primary: '#F59E0B', subtleBg: '#FFFBEB' },

  // Hydraulik — chłodny stalowy niebieski (woda, instalacje)
  plumbing:   { primary: '#1D4ED8', subtleBg: '#EFF6FF' },

  // Glazurnik — ciepły brąz terra (ceramika, płytki)
  tiling:     { primary: '#92400E', subtleBg: '#FEF3C7' },

  // Malarz / tynkarz — ciepły złoty amber (neutralny, ciepły)
  painting:   { primary: '#D97706', subtleBg: '#FFFBEB' },

  // Stolarz / cieśla — ciepły brąz drewna
  carpentry:  { primary: '#92400E', subtleBg: '#FEF3C7' },

  // Dekarz — ciemny łupek (dach = solidność, trwałość)
  roofing:    { primary: '#374151', subtleBg: '#F9FAFB' },

  // HVAC — techniczny niebieski (instalacje grzewcze, klimatyzacja)
  hvac:       { primary: '#1E40AF', subtleBg: '#EFF6FF' },

  // Murarz — ziemisty głęboki brąz
  masonry:    { primary: '#78350F', subtleBg: '#FEF3C7' },

  // Posadzkarz — ciepły brąz (parkiet, podłogi)
  flooring:   { primary: '#92400E', subtleBg: '#FEF3C7' },
};

// ── Tokeny bazowych stylów ────────────────────────────────────────────────────

/**
 * Definicje tokenów wizualnych dla trzech stylów bazowych.
 *
 * Classic  — profesjonalny, ciemny nagłówek, siatka tabeli
 *            Przeznaczenie: wszystkie dokumenty na free/basic
 *
 * Technical — niebieskoszary, techniczny, precyzyjny
 *             Przeznaczenie: protokoły, inspekcje na pro/enterprise
 *
 * Premium  — głęboka czerń, minimalistyczna elegancja, złocisty akcent
 *            Przeznaczenie: oferty, umowy na pro/enterprise
 */
export const BASE_STYLE_TOKENS: Record<VisualBaseStyle, BaseStyleTokens> = {
  classic: {
    headerBg:        '#111827', // gray-900: ciemny, profesjonalny
    headerText:      '#FFFFFF',
    sectionAccent:   '#111827', // [TRADE_ACCENT]
    accentStripeBg:  '#FEF3C7', // amber-100 [TRADE_ACCENT]
    tableAltRowBg:   '#F8FAFC', // bardzo jasny niebieskoszary
    tableHeaderBg:   '#111827',
    tableHeaderText: '#FFFFFF',
    summaryBg:       '#FFFBEB', // amber-50
    grossAccent:     '#B45309', // amber-700
    tableTheme:      'grid',
  },
  technical: {
    headerBg:        '#1E3A5F', // niebieski łupek (technical precision)
    headerText:      '#FFFFFF',
    sectionAccent:   '#1E40AF', // blue-700 [TRADE_ACCENT]
    accentStripeBg:  '#EFF6FF', // blue-50 [TRADE_ACCENT]
    tableAltRowBg:   '#F0F7FF', // bardzo jasny niebieski
    tableHeaderBg:   '#1E3A5F',
    tableHeaderText: '#FFFFFF',
    summaryBg:       '#EFF6FF', // blue-50
    grossAccent:     '#1E40AF', // blue-700
    tableTheme:      'striped',
  },
  premium: {
    headerBg:        '#0F172A', // slate-950: głęboka czerń — prestiż
    headerText:      '#FFFFFF',
    sectionAccent:   '#D97706', // amber-600: złocisty [TRADE_ACCENT]
    accentStripeBg:  '#FFFBEB', // amber-50 [TRADE_ACCENT]
    tableAltRowBg:   '#FAFAF8', // neutralne ciepłe tło
    tableHeaderBg:   '#0F172A',
    tableHeaderText: '#FFFFFF',
    summaryBg:       '#FFFBEB', // amber-50
    grossAccent:     '#92400E', // amber-800: głęboki złoty
    tableTheme:      'plain',
  },
};

// ── Logika rozwiązywania ──────────────────────────────────────────────────────

/**
 * Wybiera bazowy styl wizualny na podstawie typu dokumentu i poziomu planu.
 *
 * Reguły:
 *   free / basic  → zawsze 'classic' (profesjonalny, sprawdzony, bez przepychu)
 *   pro / enterprise:
 *     - offer, contract    → 'premium' (handlowe = prestiż)
 *     - protocol, inspection → 'technical' (techniczne = precyzja)
 *     - warranty           → 'classic' (gwarancja = zaufanie, nie luksus)
 */
function resolveBaseStyle(
  documentType: DocumentType,
  planTier: PlanTier,
): VisualBaseStyle {
  if (planTier === 'free' || planTier === 'basic') {
    return 'classic';
  }

  // pro / enterprise
  switch (documentType) {
    case 'offer':
    case 'contract':
      return 'premium';
    case 'protocol':
    case 'inspection':
      return 'technical';
    case 'warranty':
      return 'classic';
    default:
      return 'classic';
  }
}

/** Rozwiązuje flagi funkcji na podstawie poziomu planu */
function resolveFeatureFlags(planTier: PlanTier): VisualFeatureFlags {
  const isPremium = planTier === 'pro' || planTier === 'enterprise';
  const isFree = planTier === 'free';

  return {
    showLogo:     !isFree,
    showQrCode:   !isFree,
    showWatermark: isFree,
    headerStyle:  isFree ? 'minimal' : isPremium ? 'branded' : 'standard',
  };
}

/**
 * Zwraca akcent branży — bezpieczny fallback na 'general' gdy branża nieznana.
 *
 * Fallback jest deterministyczny: nieznana lub niestandardowa branża
 * zawsze zwraca neutralny amber (identyczny z 'general').
 */
function resolveTradeAccent(trade: TradeType): TradeAccentColors {
  return TRADE_ACCENT_MAP[trade] ?? TRADE_ACCENT_MAP['general'];
}

// ── Główna funkcja publiczna ──────────────────────────────────────────────────

export interface TemplateResolutionInput {
  documentType: DocumentType;
  trade: TradeType;
  planTier: PlanTier;
}

/**
 * Automatycznie rozwiązuje wariant szablonu wizualnego.
 *
 * Jedyna poprawna droga do określenia stylu PDF dokumentu.
 * Klient NIGDY nie decyduje o stylu ręcznie — zawsze ta funkcja.
 *
 * @param input - documentType + trade + planTier
 * @returns TemplateVariant — kompletny opis stylu, tokenów i flag funkcji
 *
 * Fallback jest zawsze bezpieczny:
 *   - nieznana branża  → general (amber, neutralny)
 *   - nieznany typ dok → classic
 *   - nieznany plan    → basic (bez funkcji premium)
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

// ── Pomocnicze funkcje tokenów ────────────────────────────────────────────────

/**
 * Scala tokeny stylu bazowego z akcentem branżowym.
 *
 * ZASADA: nadpisuje TYLKO `sectionAccent` i `accentStripeBg`.
 * Cała reszta (nagłówek, tabela, podsumowanie) pochodzi z bazowego stylu.
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
 * Wygodna funkcja — kompletne tokeny kolorów dla danego wariantu szablonu.
 * Łączy styl bazowy z akcentem branżowym.
 */
export function getStyleTokens(variant: TemplateVariant): BaseStyleTokens {
  return mergeStyleWithTradeAccent(variant.baseStyle, variant.tradeAccent);
}

// ── Mapowanie do PdfTemplateId (kompatybilność z jsPDF fallback) ──────────────

import type { PdfTemplateId } from '@/lib/offerDataBuilder';

/**
 * Mapuje VisualBaseStyle na PdfTemplateId używany przez offerPdfGenerator.ts.
 *
 * Używane WYŁĄCZNIE w ścieżce fallback jsPDF (gdy Edge Function niedostępna).
 * Ścieżka kanoniczna (@react-pdf/renderer) używa pełnych tokenów BaseStyleTokens.
 *
 * Mapowanie (przybliżone — jsPDF nie ma osobnego 'technical' i 'premium'):
 *   classic   → 'classic'  (ciemny nagłówek, grid)
 *   technical → 'minimal'  (lżejszy nagłówek, plain table)
 *   premium   → 'modern'   (dark band, striped)
 */
export function visualStyleToJsPdfTemplate(baseStyle: VisualBaseStyle): PdfTemplateId {
  switch (baseStyle) {
    case 'classic':   return 'classic';
    case 'technical': return 'minimal';
    case 'premium':   return 'modern';
    default:          return 'classic';
  }
}
