/**
 * PDF Design Tokens — Deno mirror (Edge Functions)
 *
 * KANONICZNE ŹRÓDŁO TOKENÓW DLA ŚRODOWISKA DENO.
 * Lustrzane odbicie src/lib/pdf/modernPdfStyles.ts (frontend/jsPDF).
 *
 * DLACZEGO DWA PLIKI:
 *   - modernPdfStyles.ts: tokeny jako RGB tuples [R, G, B] — format jsPDF
 *   - ten plik:           tokeny jako hex strings "#RRGGBB" — format @react-pdf/renderer
 *   Wartości semantyczne (kolory, rozmiary) są IDENTYCZNE w obu plikach.
 *   Różnica to wyłącznie format zgodny z docelową biblioteką renderującą.
 *
 * ZSYNCHRONIZUJ TEN PLIK gdy zmieniasz kolory w modernPdfStyles.ts.
 *
 * Roadmap: PDF Platform v2 — Canonical Renderer.
 */

// ── Kolory (hex) — sekcja 3.1 ─────────────────────────────────────────────────
// Wartości identyczne jak w src/lib/pdf/modernPdfStyles.ts

/** Główny tekst, nagłówki */
export const TEXT_PRIMARY = "#111827";

/** Opisy, etykiety, metadane */
export const TEXT_SECONDARY = "#6B7280";

/** Placeholder, wyłączone, podpowiedzi */
export const TEXT_MUTED = "#9CA3AF";

/** Główny akcent marki */
export const ACCENT_AMBER = "#F59E0B";

/** Amber subtelny — tła odznak, calloutów */
export const ACCENT_AMBER_SUBTLE = "#FEF3C7";

/** Dane, wykresy, linki */
export const ACCENT_BLUE = "#1E40AF";

/** Tło kart */
export const BG_SURFACE = "#FFFFFF";

/** Tło uniesione — hover, raised */
export const BG_SURFACE_RAISED = "#F5F3EF";

/** Ramki kart/inputów */
export const BORDER_DEFAULT = "#E8E4DC";

/** Subtelne separatory */
export const BORDER_SUBTLE = "#F0EDE8";

/** Stan sukcesu */
export const STATE_SUCCESS = "#16A34A";

/** Stan błędu */
export const STATE_ERROR = "#DC2626";

/** Tło wiersza sukcesu (green-50) — np. pozycja przyjęta w protokole */
export const STATE_SUCCESS_BG = "#F0FDF4";

/** Tło wiersza błędu (rose-50) — np. pozycja odrzucona w protokole */
export const STATE_ERROR_BG = "#FFF1F2";

// ── Skala amber — PDF summary highlights ─────────────────────────────────────

/** amber-50 */
export const AMBER_50 = "#FFFBEB";

/** amber-100 */
export const AMBER_100 = "#FEF3C7";

/** amber-700 — akcent gross total */
export const AMBER_700 = "#B45309";

/** amber-800 */
export const AMBER_800 = "#92400E";

// ── Typografia — sekcja 3.2 ───────────────────────────────────────────────────

/**
 * Czcionka nagłówkowa (zarejestrowana w Edge Function via font-config.ts).
 * Noto Sans obsługuje pełny Unicode, w tym polskie znaki diakrytyczne.
 */
export const FONT_HEADING = "NotoSans";

/** Czcionka body */
export const FONT_BODY = "NotoSans";

/** Czcionka monospace — kwoty pieniężne */
export const FONT_MONO = "NotoSansMono";

/**
 * Skala rozmiarów czcionek w pt (@react-pdf/renderer używa pt).
 * Identyczna semantycznie z FONT_SIZES w modernPdfStyles.ts (frontend).
 */
export const FONT_SIZES = {
  xs: 7.5,   // 12px → ~7.5pt (stopka, drobny druk)
  sm: 9,     // 14px → ~9pt (body mały, komórki tabeli)
  base: 10,  // 16px → ~10pt (tekst body)
  md: 11,    // 18px → ~11pt (etykiety sekcji)
  lg: 14,    // 24px → ~14pt (nagłówki sekcji)
  xl: 18,    // 32px → ~18pt (tytuł dokumentu / nazwa firmy — classic)
  "2xl": 22, // 40px → ~22pt (nazwa firmy — modern band)
} as const;

// ── Spacing (mm) — sekcja 3.4 ─────────────────────────────────────────────────

/** Marginesy PDF w mm */
export const PDF_MARGIN = 15;

/** Wartości odstępów w mm */
export const SPACING = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 24,
} as const;
