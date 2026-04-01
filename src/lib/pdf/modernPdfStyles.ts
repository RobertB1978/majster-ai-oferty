/**
 * PDF Design Tokens — KANONICZNE ŹRÓDŁO (frontend / jsPDF)
 *
 * ════════════════════════════════════════════════════════════════════════════
 * ⚑  To jest jedyne kanoniczne źródło tokenów designu PDF dla środowiska
 *    frontend (jsPDF). Zmiana wartości tutaj MUSI być zsynchronizowana z:
 *    → supabase/functions/_shared/pdf-tokens.ts  (Deno / @react-pdf/renderer)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Tokeny są jako RGB tuples [R, G, B] — format wymagany przez jsPDF
 * (setTextColor / setFillColor). Odpowiednik hex w pliku Deno powyżej.
 *
 * Aktualnie importowane przez:
 *   - offerPdfGenerator.ts        ← UŻYWA TOKENÓW
 *   - templatePdfGenerator.ts     ← OCZEKUJE MIGRACJI (hardkodowane kolory)
 *   - warrantyPdfGenerator.ts     ← OCZEKUJE MIGRACJI (hardkodowane kolory)
 *
 * Derived from design system sections 3.1–3.4.
 *
 * NOTE: Bricolage Grotesque requires TTF for jsPDF embedding.
 * Only woff2 is currently available in /public/fonts/.
 * Heading font fallback: helvetica (built-in jsPDF font).
 * Full Bricolage support planned for @react-pdf/renderer migration (sekcja 26.2).
 */

// ---------------------------------------------------------------------------
// Color tokens (RGB tuples) — section 3.1
// ---------------------------------------------------------------------------

/** Main text, headings */
export const TEXT_PRIMARY: [number, number, number] = [17, 24, 39]; // #111827

/** Descriptions, labels, metadata */
export const TEXT_SECONDARY: [number, number, number] = [107, 114, 128]; // #6B7280

/** Placeholder, disabled, hints */
export const TEXT_MUTED: [number, number, number] = [156, 163, 175]; // #9CA3AF

/** Primary brand accent */
export const ACCENT_AMBER: [number, number, number] = [245, 158, 11]; // #F59E0B

/** Amber hover / dark accent */
export const ACCENT_AMBER_HOVER: [number, number, number] = [217, 119, 6]; // #D97706

/** Amber subtle background for badges, callouts */
export const ACCENT_AMBER_SUBTLE: [number, number, number] = [254, 243, 199]; // #FEF3C7

/** Data, charts, links */
export const ACCENT_BLUE: [number, number, number] = [30, 64, 175]; // #1E40AF

/** Card surface */
export const BG_SURFACE: [number, number, number] = [255, 255, 255]; // #FFFFFF

/** Raised surface, hover */
export const BG_SURFACE_RAISED: [number, number, number] = [245, 243, 239]; // #F5F3EF

/** Card/input borders */
export const BORDER_DEFAULT: [number, number, number] = [232, 228, 220]; // #E8E4DC

/** Subtle separators */
export const BORDER_SUBTLE: [number, number, number] = [240, 237, 232]; // #F0EDE8

/** Success state */
export const STATE_SUCCESS: [number, number, number] = [22, 163, 74]; // #16A34A

/** Error state */
export const STATE_ERROR: [number, number, number] = [220, 38, 38]; // #DC2626

// ---------------------------------------------------------------------------
// Amber scale for PDF summary highlights
// ---------------------------------------------------------------------------

/** amber-50 */
export const AMBER_50: [number, number, number] = [255, 251, 235]; // #FFFBEB

/** amber-100 */
export const AMBER_100: [number, number, number] = [254, 243, 199]; // #FEF3C7

/** amber-700 — used for gross total accent */
export const AMBER_700: [number, number, number] = [180, 83, 9]; // #B45309

/** amber-800 */
export const AMBER_800: [number, number, number] = [146, 64, 14]; // #92400E

// ---------------------------------------------------------------------------
// Typography — section 3.2
// ---------------------------------------------------------------------------

/**
 * Heading font: Bricolage Grotesque (self-hosted woff2 in /public/fonts/).
 * jsPDF requires TTF — falls back to helvetica for now.
 * Full support with @react-pdf/renderer migration (sekcja 26.2).
 */
export const FONT_HEADING = 'helvetica'; // fallback until TTF available

/** Body font */
export const FONT_BODY = 'helvetica';

/** Monospace font for monetary amounts — JetBrains Mono (base64 TTF registered in jsPDF) */
export const FONT_MONO = 'JetBrainsMono';

/** Font size scale (px → pt approximate for PDF) — section 3.2 */
export const FONT_SIZES = {
  xs: 7.5,    // 12px → ~7.5pt (footer, fine print)
  sm: 9,      // 14px → ~9pt (body small, table cells)
  base: 10,   // 16px → ~10pt (body text)
  md: 11,     // 18px → ~11pt (section labels)
  lg: 14,     // 24px → ~14pt (section headings)
  xl: 18,     // 32px → ~18pt (document title / company name — classic)
  '2xl': 22,  // 40px → ~22pt (company name — modern band)
} as const;

// ---------------------------------------------------------------------------
// Spacing — section 3.4
// ---------------------------------------------------------------------------

/** PDF margins in mm */
export const PDF_MARGIN = 15;

/** Spacing values in mm */
export const SPACING = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
} as const;

// ---------------------------------------------------------------------------
// Logo placeholder
// ---------------------------------------------------------------------------

/** Size for the company logo placeholder (mm) */
export const LOGO_PLACEHOLDER_SIZE = 14;

/**
 * Draw a logo placeholder: rounded square with company initial.
 * Used when company has no logoUrl.
 */
export function drawLogoPlaceholder(
  doc: import('jspdf').default,
  x: number,
  y: number,
  companyName: string,
  size: number = LOGO_PLACEHOLDER_SIZE,
): void {
  const initial = companyName.trim().charAt(0).toUpperCase() || 'M';

  // Amber rounded square
  doc.setFillColor(ACCENT_AMBER[0], ACCENT_AMBER[1], ACCENT_AMBER[2]);
  doc.roundedRect(x, y, size, size, 2, 2, 'F');

  // White initial letter centered
  doc.setFontSize(size * 0.55);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(initial, x + size / 2, y + size * 0.68, { align: 'center' });
}
