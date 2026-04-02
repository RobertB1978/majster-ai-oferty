/**
 * Rejestracja czcionki NotoSans (Latin + Cyrillic subset) w jsPDF.
 *
 * Zastępuje wbudowaną Helvetica, która NIE obsługuje polskich znaków diakrytycznych
 * (ą ć ę ł ń ś ź ż leżą poza Latin-1 / ISO 8859-1).
 *
 * NotoSans subset pokrywa:
 *   - Basic Latin + Latin-1 Supplement
 *   - Latin Extended-A (polskie znaki)
 *   - Cyrillic Basic (ukraiński alfabet)
 *
 * Użycie: wywołaj registerNotoSans(doc) przed generowaniem treści.
 * Zwraca nazwę czcionki do użycia z doc.setFont().
 * Przy niepowodzeniu zwraca 'helvetica' jako degradowany fallback.
 */

import type jsPDF from 'jspdf';
import { NOTO_SANS_REGULAR_B64, NOTO_SANS_BOLD_B64 } from '../noto-sans-b64';

const FONT_NAME = 'NotoSans';
const FILE_REGULAR = 'NotoSans-Regular.ttf';
const FILE_BOLD = 'NotoSans-Bold.ttf';
const FALLBACK = 'helvetica';

/**
 * Rejestruje NotoSans (regular + bold) w instancji jsPDF.
 * Idempotentne — bezpieczne do wywołania wielokrotnie.
 *
 * @returns nazwa czcionki: 'NotoSans' przy sukcesie, 'helvetica' przy błędzie
 */
export function registerNotoSans(doc: jsPDF): string {
  try {
    doc.addFileToVFS(FILE_REGULAR, NOTO_SANS_REGULAR_B64);
    doc.addFileToVFS(FILE_BOLD, NOTO_SANS_BOLD_B64);
    doc.addFont(FILE_REGULAR, FONT_NAME, 'normal');
    doc.addFont(FILE_BOLD, FONT_NAME, 'bold');
    return FONT_NAME;
  } catch {
    return FALLBACK;
  }
}
