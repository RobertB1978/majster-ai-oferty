/**
 * Narzędzia do parsowania liczb dziesiętnych akceptujące zarówno przecinek (,)
 * jak i kropkę (.) jako separator dziesiętny. Przeznaczone do pól Ilość i Cena
 * w formularzach wycen.
 */

/**
 * Parsuje ciąg znaków do liczby dziesiętnej.
 * Akceptuje przecinek lub kropkę jako separator dziesiętny.
 * Zwraca null, gdy wejście nie jest poprawną skończoną liczbą.
 *
 * @example
 * parseDecimal('12,5')  // → 12.5
 * parseDecimal('12.5')  // → 12.5
 * parseDecimal('100')   // → 100
 * parseDecimal('abc')   // → null
 * parseDecimal('')      // → null
 */
export function parseDecimal(input: string): number | null {
  // Usuń białe znaki z początku i końca oraz wewnętrzne spacje
  const trimmed = input.trim().replace(/\s+/g, '');
  if (!trimmed) return null;

  // Dozwolony format: opcjonalny minus, cyfry, opcjonalny separator (,/.) i kolejne cyfry
  if (!/^-?\d+([.,]\d*)?$/.test(trimmed)) return null;

  // Normalizacja: zamiana przecinka na kropkę
  const normalized = trimmed.replace(',', '.');

  const num = parseFloat(normalized);
  if (isNaN(num) || !isFinite(num)) return null;

  return num;
}

/**
 * Zwraca true, gdy ciąg znaków można sparsować jako poprawną liczbę dziesiętną.
 */
export function isValidDecimal(input: string): boolean {
  return parseDecimal(input) !== null;
}
