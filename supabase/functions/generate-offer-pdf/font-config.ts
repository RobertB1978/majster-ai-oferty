/**
 * font-config — Rejestracja polskich czcionek Unicode dla @react-pdf/renderer.
 *
 * PDF Platform v2 Foundation — pipeline czcionek dla Edge Function Deno.
 *
 * PROBLEM:
 *   Wbudowane czcionki @react-pdf/renderer (Helvetica, Courier) to standardowe
 *   czcionki PDF Type 1, które pokrywają wyłącznie Latin-1 (ISO 8859-1).
 *   Polskie znaki diakrytyczne (ą ć ę ł ń ó ś ź ż) LEŻĄ POZA Latin-1 i
 *   renderują się jako puste glify (U+0105, U+0107, U+0119 itd. nie mają
 *   odwzorowania w standardowych czcionkach Helvetica/Courier PDF).
 *   Efekt: nazwy klientów, pozycje kosztorysu i etykiety z polskimi literami
 *   pojawiają się w PDF jako "????????" lub puste miejsca.
 *
 * ROZWIĄZANIE:
 *   Rejestrujemy Noto Sans (body) i Noto Sans Mono (monospace kwot) z CDN jsDelivr.
 *   Noto Sans jest zaprojektowany z myślą o pełnym pokryciu Unicode, w tym
 *   Latin Extended (U+0100–U+024F), który zawiera wszystkie polskie litery.
 *   Format TTF jest natywnie obsługiwany przez fontkit (@react-pdf/renderer).
 *
 * ŹRÓDŁO CZCIONEK:
 *   Repozytorium notofonts/noto-fonts (Google) via jsDelivr CDN.
 *   jsDelivr jest globalnie dystrybuowanym CDN z >99.99% uptime.
 *   Wersja @main oznacza bieżącą gałąź główną — do przypięcia do konkretnego
 *   commita w trakcie hardeningu produkcyjnego.
 *
 * FALLBACK:
 *   Jeżeli rejestracja się nie powiedzie, renderer użyje Helvetica (Courier).
 *   To oznacza uszkodzone polskie znaki w wygenerowanym PDF.
 *   Błąd jest logowany jako CRITICAL — nie jest wyciszany milcząco.
 *   Klient-side jsPDF fallback wciąż działa (używa JetBrains Mono z base64).
 *
 * TODO(pdf-v2-hardening): Zmigruj źródło czcionek na Supabase Storage
 *   (/public/fonts/) dla zero-zewnętrznej-zależności CDN w produkcji.
 *   Supabase Storage jest w tej samej sieci co Edge Function (niskie opóźnienie).
 */

// deno-lint-ignore-file no-explicit-any
import { Font } from "npm:@react-pdf/renderer@3";

// ── Źródła czcionek (jsDelivr CDN — GitHub notofonts/noto-fonts) ──────────────
//
// Plik TTF Noto Sans Regular pokrywa:
//   Basic Latin (U+0000–U+007F)
//   Latin-1 Supplement (U+0080–U+00FF)
//   Latin Extended-A (U+0100–U+017F) ← zawiera ą ć ę ł ń ś ź ż
//   Latin Extended-B (U+0180–U+024F)
//   oraz wiele innych skryptów (cyrylica, greka, itp.)
//
// TODO(pdf-v2-hardening): Przypiąć do konkretnego taga/commita repo, np.:
//   @v1.0/hinted/... zamiast @main/hinted/...

const CDN_BASE =
  "https://cdn.jsdelivr.net/gh/notofonts/noto-fonts@main/hinted/ttf";

const FONT_URLS = {
  notoSansRegular: `${CDN_BASE}/NotoSans/NotoSans-Regular.ttf`,
  notoSansBold: `${CDN_BASE}/NotoSans/NotoSans-Bold.ttf`,
  notoSansItalic: `${CDN_BASE}/NotoSans/NotoSans-Italic.ttf`,
  notoSansMonoRegular: `${CDN_BASE}/NotoSansMono/NotoSansMono-Regular.ttf`,
  notoSansMonoBold: `${CDN_BASE}/NotoSansMono/NotoSansMono-Bold.ttf`,
} as const;

/** Nazwa rodziny czcionek body (NotoSans lub Helvetica fallback) */
export const FONT_FAMILY_BODY = "NotoSans";

/** Nazwa rodziny czcionek monospace (NotoSansMono lub Courier fallback) */
export const FONT_FAMILY_MONO = "NotoSansMono";

/** Nazwa rodziny fallback body (gdy NotoSans nie zdołał się załadować) */
export const FONT_FAMILY_BODY_FALLBACK = "Helvetica";

/** Nazwa rodziny fallback monospace (gdy NotoSansMono nie zdołał się załadować) */
export const FONT_FAMILY_MONO_FALLBACK = "Courier";

// ── Stan rejestracji ──────────────────────────────────────────────────────────

/**
 * Czy rejestracja polskich czcionek się powiodła.
 * false przed wywołaniem registerPolishFonts() lub po jego niepowodzeniu.
 */
let polishFontsRegistered = false;

// ── API publiczne ─────────────────────────────────────────────────────────────

/**
 * Rejestruje Noto Sans i Noto Sans Mono w @react-pdf/renderer.
 * Bezpieczne do wywołania wielokrotnie (idempotentne).
 *
 * WAŻNE: Font.register() jest synchroniczne — rejestruje tylko konfigurację.
 * Faktyczne ładowanie czcionek z URL odbywa się leniwie podczas renderToBuffer().
 * Jeżeli URL jest niedostępny w czasie renderowania, renderToBuffer() rzuci wyjątek.
 *
 * @returns true jeśli rejestracja się powiodła (lub była już wcześniej wykonana)
 */
export function registerPolishFonts(): boolean {
  if (polishFontsRegistered) return true;

  try {
    // Czcionka body: Noto Sans — pełne pokrycie Latin Extended (polskie znaki)
    Font.register({
      family: FONT_FAMILY_BODY,
      fonts: [
        {
          src: FONT_URLS.notoSansRegular,
          fontStyle: "normal",
          fontWeight: "normal",
        },
        {
          src: FONT_URLS.notoSansBold,
          fontStyle: "normal",
          fontWeight: "bold",
        },
        {
          src: FONT_URLS.notoSansItalic,
          fontStyle: "italic",
          fontWeight: "normal",
        },
      ],
    });

    // Czcionka monospace: Noto Sans Mono — dla kwot, kodów, dat w formacie stałym
    Font.register({
      family: FONT_FAMILY_MONO,
      fonts: [
        {
          src: FONT_URLS.notoSansMonoRegular,
          fontStyle: "normal",
          fontWeight: "normal",
        },
        {
          src: FONT_URLS.notoSansMonoBold,
          fontStyle: "normal",
          fontWeight: "bold",
        },
      ],
    });

    polishFontsRegistered = true;
    console.info(
      "[pdf-font] Rejestracja polskich czcionek zakończona pomyślnie " +
        `(${FONT_FAMILY_BODY}, ${FONT_FAMILY_MONO} z jsDelivr CDN).`,
    );
    return true;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[pdf-font] CRITICAL: Rejestracja polskich czcionek nie powiodła się. ` +
        `Polskie znaki diakrytyczne będą uszkodzone w wygenerowanym PDF. ` +
        `Błąd: ${message}`,
    );
    polishFontsRegistered = false;
    return false;
  }
}

/**
 * Zwraca nazwę rodziny czcionek do użycia dla tekstu podstawowego.
 * Wywołać PO registerPolishFonts().
 *
 * Zwraca 'NotoSans' jeśli rejestracja się powiodła,
 * 'Helvetica' jako zdegradowany fallback (uszkodzone polskie znaki).
 */
export function getBodyFontFamily(): string {
  return polishFontsRegistered ? FONT_FAMILY_BODY : FONT_FAMILY_BODY_FALLBACK;
}

/**
 * Zwraca nazwę rodziny czcionek monospace dla kwot i kodów.
 * Wywołać PO registerPolishFonts().
 *
 * Zwraca 'NotoSansMono' jeśli rejestracja się powiodła,
 * 'Courier' jako zdegradowany fallback.
 */
export function getMonoFontFamily(): string {
  return polishFontsRegistered ? FONT_FAMILY_MONO : FONT_FAMILY_MONO_FALLBACK;
}

/**
 * Czy polskie czcionki są aktualnie zarejestrowane.
 * Używane do testowania i raportowania stanu w logach.
 */
export function arePolishFontsRegistered(): boolean {
  return polishFontsRegistered;
}
