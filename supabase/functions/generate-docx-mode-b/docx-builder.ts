/**
 * docx-builder.ts — generate-docx-mode-b Edge Function
 * PR-05a (Mode B Base Contracts)
 *
 * Wspólne narzędzia do budowania dokumentów DOCX.
 * Używa npm:docx (docx.js) — Plan B wg ADR-0013 §7.4.
 *
 * Eksportuje:
 *   - Stałe stylów (fonty, marginesy, kolory)
 *   - Helpery paragrafów i tekstu
 *   - Helpery tabel
 *   - Blok podpisów
 *   - Nagłówek i stopka dokumentu
 *   - Disclaimer
 *   - buildDocument() — składa gotowy Document
 */

// deno-lint-ignore-file no-explicit-any
import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
  PageOrientation,
  convertInchesToTwip,
  Header,
  Footer,
  PageNumber,
} from "npm:docx@8.5.0";

// ── Stałe stylów ──────────────────────────────────────────────────────────────

export const FONT_BODY = "Calibri";
export const FONT_HEADING = "Calibri";
export const COLOR_PRIMARY = "1F3864";   // granatowy Majster.AI
export const COLOR_ACCENT = "2F5496";    // niebieski akcentowy
export const COLOR_LIGHT = "D6E4F0";     // jasnoniebieski tło tabeli
export const COLOR_GRAY = "595959";      // szary tekst pomocniczy
export const COLOR_BLACK = "000000";
export const SIZE_BODY = 22;             // 11pt w half-points
export const SIZE_SMALL = 18;            // 9pt
export const SIZE_HEADING1 = 28;         // 14pt
export const SIZE_HEADING2 = 24;         // 12pt bold
export const SIZE_HEADING3 = 22;         // 11pt bold

/** Marginesy strony (twips). */
export const PAGE_MARGINS = {
  top:    convertInchesToTwip(1.0),
  bottom: convertInchesToTwip(1.0),
  left:   convertInchesToTwip(1.2),
  right:  convertInchesToTwip(1.0),
};

// ── Helpery paragrafów ────────────────────────────────────────────────────────

/** Pusty akapit jako odstęp. */
export function spacer(lines = 1): Paragraph[] {
  return Array.from({ length: lines }, () =>
    new Paragraph({ text: "", spacing: { after: 0, before: 0 } })
  );
}

/** Tytuł dokumentu — wyśrodkowany, duży. */
export function docTitle(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        size: SIZE_HEADING1,
        color: COLOR_PRIMARY,
        font: FONT_HEADING,
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 120 },
  });
}

/** Podtytuł dokumentu — wyśrodkowany, mniejszy. */
export function docSubtitle(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        size: SIZE_BODY,
        color: COLOR_GRAY,
        font: FONT_BODY,
        italics: true,
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 360 },
  });
}

/** Nagłówek sekcji (§ X. Tytuł). */
export function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        size: SIZE_HEADING2,
        color: COLOR_PRIMARY,
        font: FONT_HEADING,
      }),
    ],
    spacing: { before: 280, after: 120 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 1, color: COLOR_LIGHT, space: 2 },
    },
  });
}

/** Akapit główny. */
export function para(text: string, opts?: {
  bold?: boolean;
  italic?: boolean;
  indent?: boolean;
  align?: (typeof AlignmentType)[keyof typeof AlignmentType];
  before?: number;
  after?: number;
}): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: opts?.bold,
        italics: opts?.italic,
        size: SIZE_BODY,
        font: FONT_BODY,
        color: COLOR_BLACK,
      }),
    ],
    alignment: opts?.align ?? AlignmentType.JUSTIFIED,
    indent: opts?.indent ? { left: convertInchesToTwip(0.25) } : undefined,
    spacing: { before: opts?.before ?? 80, after: opts?.after ?? 80 },
  });
}

/** Akapit z fragmentem wyróżnionym (mieszane style). */
export function paraRuns(runs: Array<{
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}>, opts?: { indent?: boolean; before?: number; after?: number }): Paragraph {
  return new Paragraph({
    children: runs.map((r) =>
      new TextRun({
        text: r.text,
        bold: r.bold,
        italics: r.italic,
        underline: r.underline ? {} : undefined,
        size: SIZE_BODY,
        font: FONT_BODY,
        color: COLOR_BLACK,
      })
    ),
    alignment: AlignmentType.JUSTIFIED,
    indent: opts?.indent ? { left: convertInchesToTwip(0.25) } : undefined,
    spacing: { before: opts?.before ?? 80, after: opts?.after ?? 80 },
  });
}

/** Element listy numerowanej (1. / 2. / ...). */
export function listItem(number: number | string, text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: `${number}. `, bold: true, size: SIZE_BODY, font: FONT_BODY }),
      new TextRun({ text, size: SIZE_BODY, font: FONT_BODY, color: COLOR_BLACK }),
    ],
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: convertInchesToTwip(0.25) },
    spacing: { before: 60, after: 60 },
  });
}

/** Element listy punktowej. */
export function bulletItem(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: "• ", bold: true, size: SIZE_BODY, font: FONT_BODY, color: COLOR_ACCENT }),
      new TextRun({ text, size: SIZE_BODY, font: FONT_BODY, color: COLOR_BLACK }),
    ],
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: convertInchesToTwip(0.25) },
    spacing: { before: 60, after: 60 },
  });
}

/** Pole do wypełnienia — wyróżnione wizualnie. */
export function field(label: string): string {
  return `[${label}]`;
}

// ── Helpery tabel ─────────────────────────────────────────────────────────────

function borderDef() {
  return {
    top:    { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" },
    left:   { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" },
    right:  { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" },
  };
}

function headerCell(text: string): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({ text, bold: true, size: SIZE_SMALL, font: FONT_BODY, color: "FFFFFF" }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 60 },
      }),
    ],
    shading: { fill: COLOR_PRIMARY, type: ShadingType.CLEAR, color: "auto" },
    borders: borderDef(),
  });
}

function dataCell(text: string, shaded = false): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({ text, size: SIZE_SMALL, font: FONT_BODY, color: COLOR_BLACK }),
        ],
        alignment: AlignmentType.LEFT,
        spacing: { before: 60, after: 60 },
        indent: { left: convertInchesToTwip(0.05) },
      }),
    ],
    shading: shaded ? { fill: "F5F8FA", type: ShadingType.CLEAR, color: "auto" } : undefined,
    borders: borderDef(),
  });
}

/** Tabela z nagłówkiem i wierszami danych. */
export function dataTable(
  headers: string[],
  rows: string[][],
  widths?: number[],
): Table {
  const totalWidth = 9000; // twips ~15.7cm
  const colWidths = widths
    ? widths
    : headers.map(() => Math.floor(totalWidth / headers.length));

  const headerRow = new TableRow({
    children: headers.map((h, i) => {
      const cell = headerCell(h);
      (cell as any).options = { ...(cell as any).options, width: { size: colWidths[i], type: WidthType.DXA } };
      return cell;
    }),
    tableHeader: true,
  });

  const dataRows = rows.map((row, ri) =>
    new TableRow({
      children: row.map((cell) => dataCell(cell, ri % 2 === 1)),
    })
  );

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: totalWidth, type: WidthType.DXA },
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
  });
}

/** Tabela dwukolumnowa klucz–wartość (dane stron umowy). */
export function keyValueTable(rows: Array<[string, string]>): Table {
  return new Table({
    rows: rows.map(([key, val]) =>
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: key, bold: true, size: SIZE_SMALL, font: FONT_BODY })],
                spacing: { before: 60, after: 60 },
                indent: { left: convertInchesToTwip(0.05) },
              }),
            ],
            width: { size: 2800, type: WidthType.DXA },
            shading: { fill: "EEF3FA", type: ShadingType.CLEAR, color: "auto" },
            borders: borderDef(),
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: val, size: SIZE_SMALL, font: FONT_BODY, italics: val.startsWith("[") })],
                spacing: { before: 60, after: 60 },
                indent: { left: convertInchesToTwip(0.05) },
              }),
            ],
            width: { size: 6200, type: WidthType.DXA },
            borders: borderDef(),
          }),
        ],
      })
    ),
    width: { size: 9000, type: WidthType.DXA },
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
  });
}

// ── Blok podpisów ─────────────────────────────────────────────────────────────

/** Blok podpisów dwustronnych (Zamawiający / Wykonawca). */
export function signatureBlock(): Table {
  function sigCell(role: string, name: string): TableCell {
    return new TableCell({
      children: [
        new Paragraph({
          children: [new TextRun({ text: role, bold: true, size: SIZE_SMALL, font: FONT_BODY })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 60, after: 200 },
        }),
        new Paragraph({
          children: [new TextRun({ text: name, italics: true, size: SIZE_SMALL, font: FONT_BODY, color: COLOR_GRAY })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 400 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "___________________________________", size: SIZE_SMALL, font: FONT_BODY })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 60 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "podpis i pieczęć", size: 16, font: FONT_BODY, color: COLOR_GRAY, italics: true })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 0 },
        }),
      ],
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: "auto" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
        left: { style: BorderStyle.NONE, size: 0, color: "auto" },
        right: { style: BorderStyle.NONE, size: 0, color: "auto" },
      },
    });
  }

  return new Table({
    rows: [
      new TableRow({
        children: [
          sigCell("ZAMAWIAJĄCY", field("imię i nazwisko / nazwa firmy")),
          new TableCell({
            children: [new Paragraph({ text: "" })],
            width: { size: 1000, type: WidthType.DXA },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "auto" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
              left: { style: BorderStyle.NONE, size: 0, color: "auto" },
              right: { style: BorderStyle.NONE, size: 0, color: "auto" },
            },
          }),
          sigCell("WYKONAWCA", field("imię i nazwisko / nazwa firmy")),
        ],
      }),
    ],
    width: { size: 9000, type: WidthType.DXA },
  });
}

// ── Disclaimer ────────────────────────────────────────────────────────────────

/** Obowiązkowy disclaimer Trybu B (ADR-0013 §3.3). */
export function disclaimer(): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: "⚠ Wzór do dostosowania i weryfikacji prawnej przed użyciem.",
        bold: true,
        size: SIZE_SMALL,
        font: FONT_BODY,
        color: "C00000",
      }),
    ],
    alignment: AlignmentType.CENTER,
    border: {
      top: { style: BorderStyle.SINGLE, size: 2, color: "C00000", space: 4 },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: "C00000", space: 4 },
    },
    spacing: { before: 120, after: 120 },
    shading: { fill: "FFF2CC", type: ShadingType.CLEAR, color: "auto" },
  });
}

// ── Nagłówek / stopka ─────────────────────────────────────────────────────────

function buildHeader(docTitle: string): Header {
  return new Header({
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: "Majster.AI  |  ", size: SIZE_SMALL, font: FONT_BODY, color: COLOR_GRAY }),
          new TextRun({ text: docTitle, size: SIZE_SMALL, font: FONT_BODY, color: COLOR_GRAY, italics: true }),
        ],
        alignment: AlignmentType.LEFT,
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: COLOR_LIGHT, space: 2 } },
      }),
    ],
  });
}

function buildFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: "Strona ", size: SIZE_SMALL, font: FONT_BODY, color: COLOR_GRAY }),
          new PageNumber(),
          new TextRun({ text: "   •   Majster.AI — wzór do weryfikacji prawnej", size: SIZE_SMALL, font: FONT_BODY, color: COLOR_GRAY }),
        ],
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 1, color: COLOR_LIGHT, space: 2 } },
      }),
    ],
  });
}

// ── buildDocument ─────────────────────────────────────────────────────────────

/** Składa gotowy Document z tablicy sekcji (children). */
export function buildDocument(
  title: string,
  sections: Array<Paragraph | Table>,
): Document {
  return new Document({
    creator: "Majster.AI",
    title,
    description: "Dokument wygenerowany przez Majster.AI — Tryb B",
    styles: {
      default: {
        document: {
          run: { font: FONT_BODY, size: SIZE_BODY, color: COLOR_BLACK },
          paragraph: { spacing: { after: 80 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: PAGE_MARGINS,
            size: { orientation: PageOrientation.PORTRAIT },
          },
        },
        headers: { default: buildHeader(title) },
        footers: { default: buildFooter() },
        children: sections,
      },
    ],
  });
}
