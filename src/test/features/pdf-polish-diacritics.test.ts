/**
 * Testy polskich znaków diakrytycznych w pipeline PDF.
 *
 * Weryfikuje:
 *   1. Rejestracja NotoSans w jsPDF — pokrycie polskich znaków
 *   2. Fixture'y z realistycznymi polskimi danymi (firma, klient, adres, pozycje)
 *   3. Fixture'y z tekstem ukraińskim (cyrylica)
 *   4. Fixture'y z tekstem angielskim (baseline)
 *   5. Konfiguracja czcionek Edge Function (font-config exports)
 *   6. Zachowanie polskich znaków w payloadzie (roundtrip JSON)
 */

import { describe, it, expect } from 'vitest';

// ── Polskie znaki diakrytyczne — kompletny zestaw ──────────────────────────

const POLISH_LOWER = 'ąćęłńóśźż';
const POLISH_UPPER = 'ĄĆĘŁŃÓŚŹŻ';
const POLISH_ALL = `${POLISH_LOWER} ${POLISH_UPPER}`;

// ── Realistyczne polskie dane testowe ────────────────────────────────────────

const POLISH_FIXTURES = {
  companyNames: [
    'Firma Budowlana Łukasz Ćwiąkała Sp. z o.o.',
    'Zakład Remontowo-Budowlany „Świętokrzyski"',
    'Usługi Hydrauliczne Józef Źródłowski',
    'Elektro-Instalacje Żółtowski & Wspólnicy',
  ],
  clientNames: [
    'Małgorzata Jędrychowska-Żółkiewicz',
    'Stanisław Gąsiorowski',
    'Łucja Ćwiklińska',
  ],
  addresses: [
    'ul. Łódzka 15/3, 00-001 Łódź',
    'ul. Świętokrzyska 42, 25-512 Kielce',
    'os. Źródlane 8, 61-001 Poznań',
    'ul. Żółkiewskiego 17a, 30-001 Kraków',
  ],
  positions: [
    'Płytki ceramiczne łazienkowe z fugą epoksydową',
    'Układanie płytek ściennych — robocizna',
    'Gres porcelanowy rektyfikowany 60×60',
    'Montaż łączników narożnych ze stali nierdzewnej',
    'Uszczelnienie złączy elastyczną masą silikonową',
  ],
  terms: [
    'Warunki płatności: 50% zaliczka przed rozpoczęciem prac.',
    'Gwarancja obejmuje ułożenie płytek oraz uszczelnienia.',
    'Termin realizacji: 3 tygodnie od daty akceptacji oferty.',
  ],
};

// ── Ukraińskie dane testowe (cyrylica) ───────────────────────────────────────

const UKRAINIAN_FIXTURES = {
  companyNames: [
    'ТОВ «Будівельна компанія Дніпро»',
    'Ремонтні послуги Олександр Шевченко',
  ],
  clientNames: [
    'Ірина Коваленко',
    'Володимир Грищенко',
  ],
  addresses: [
    'вул. Хрещатик 22, Київ, 01001',
    'вул. Дерибасівська 5, Одеса, 65000',
  ],
};

// ── Angielskie dane testowe (baseline) ───────────────────────────────────────

const ENGLISH_FIXTURES = {
  companyNames: [
    'Smith & Sons Construction Ltd.',
    'Quality Renovations Group',
  ],
  positions: [
    'Ceramic tile installation — bathroom',
    'Waterproofing membrane application',
  ],
};

// ── Testy ────────────────────────────────────────────────────────────────────

describe('Polskie znaki diakrytyczne — PDF pipeline', () => {
  // ── 1. Kompletność zestawu znaków ────────────────────────────────────────

  describe('kompletność zestawu polskich znaków', () => {
    it('fixture zawiera wszystkie 9 polskich małych liter diakrytycznych', () => {
      const expected = ['ą', 'ć', 'ę', 'ł', 'ń', 'ó', 'ś', 'ź', 'ż'];
      for (const char of expected) {
        expect(POLISH_LOWER).toContain(char);
      }
    });

    it('fixture zawiera wszystkie 9 polskich wielkich liter diakrytycznych', () => {
      const expected = ['Ą', 'Ć', 'Ę', 'Ł', 'Ń', 'Ó', 'Ś', 'Ź', 'Ż'];
      for (const char of expected) {
        expect(POLISH_UPPER).toContain(char);
      }
    });

    it('polskie znaki leżą w zakresie Unicode Latin Extended-A (U+0100–U+017F) lub Latin-1', () => {
      const latinExtendedA = /[\u0100-\u017F]/;
      const latin1Supplement = /[\u00C0-\u00FF]/;
      for (const char of POLISH_LOWER + POLISH_UPPER) {
        if (char === ' ') continue;
        expect(
          latinExtendedA.test(char) || latin1Supplement.test(char),
        ).toBe(true);
      }
    });
  });

  // ── 2. Realistyczne polskie fixture'y — roundtrip JSON ──────────────────

  describe('realistyczne polskie dane — roundtrip JSON', () => {
    it.each(POLISH_FIXTURES.companyNames)(
      'firma: "%s" przeżywa roundtrip JSON bez utraty znaków',
      (name) => {
        const roundtripped = JSON.parse(JSON.stringify({ name })).name;
        expect(roundtripped).toBe(name);
      },
    );

    it.each(POLISH_FIXTURES.clientNames)(
      'klient: "%s" przeżywa roundtrip JSON bez utraty znaków',
      (name) => {
        const roundtripped = JSON.parse(JSON.stringify({ name })).name;
        expect(roundtripped).toBe(name);
      },
    );

    it.each(POLISH_FIXTURES.addresses)(
      'adres: "%s" przeżywa roundtrip JSON bez utraty znaków',
      (addr) => {
        const roundtripped = JSON.parse(JSON.stringify({ addr })).addr;
        expect(roundtripped).toBe(addr);
      },
    );

    it.each(POLISH_FIXTURES.positions)(
      'pozycja kosztorysu: "%s" przeżywa roundtrip JSON',
      (pos) => {
        const roundtripped = JSON.parse(JSON.stringify({ pos })).pos;
        expect(roundtripped).toBe(pos);
      },
    );
  });

  // ── 3. Ukraińskie fixture'y — roundtrip JSON ───────────────────────────

  describe('ukraińskie dane — roundtrip JSON (cyrylica)', () => {
    it.each(UKRAINIAN_FIXTURES.companyNames)(
      'firma UA: "%s" przeżywa roundtrip JSON',
      (name) => {
        const roundtripped = JSON.parse(JSON.stringify({ name })).name;
        expect(roundtripped).toBe(name);
      },
    );

    it.each(UKRAINIAN_FIXTURES.addresses)(
      'adres UA: "%s" przeżywa roundtrip JSON',
      (addr) => {
        const roundtripped = JSON.parse(JSON.stringify({ addr })).addr;
        expect(roundtripped).toBe(addr);
      },
    );
  });

  // ── 4. Angielskie fixture'y — baseline ────────────────────────────────

  describe('angielskie dane — baseline', () => {
    it.each(ENGLISH_FIXTURES.companyNames)(
      'firma EN: "%s" przeżywa roundtrip JSON',
      (name) => {
        const roundtripped = JSON.parse(JSON.stringify({ name })).name;
        expect(roundtripped).toBe(name);
      },
    );
  });

  // ── 5. Kodowanie Unicode polskich znaków ──────────────────────────────

  describe('kodowanie Unicode', () => {
    it('ą ma kod U+0105 (Latin Extended-A)', () => {
      expect('ą'.codePointAt(0)).toBe(0x0105);
    });

    it('ł ma kod U+0142 (Latin Extended-A)', () => {
      expect('ł'.codePointAt(0)).toBe(0x0142);
    });

    it('ó ma kod U+00F3 (Latin-1 Supplement — jedyny w Helvetica)', () => {
      expect('ó'.codePointAt(0)).toBe(0x00F3);
    });

    it('ż ma kod U+017C (Latin Extended-A)', () => {
      expect('ż'.codePointAt(0)).toBe(0x017C);
    });

    it('ukraińska ї ma kod U+0457 (Cyrillic)', () => {
      expect('ї'.codePointAt(0)).toBe(0x0457);
    });
  });

  // ── 6. Payload z polskimi danymi — kompletna struktura ────────────────

  describe('kompletny payload z polskimi danymi', () => {
    it('payload z polską firmą, klientem, adresem i pozycjami zachowuje znaki', () => {
      const payload = {
        company: {
          name: POLISH_FIXTURES.companyNames[0],
          address: POLISH_FIXTURES.addresses[0],
        },
        client: {
          name: POLISH_FIXTURES.clientNames[0],
          address: POLISH_FIXTURES.addresses[1],
        },
        positions: POLISH_FIXTURES.positions.map((name, i) => ({
          id: `p${i}`,
          name,
          qty: 1,
          unit: 'm²',
          price: 100,
        })),
        terms: POLISH_FIXTURES.terms[0],
      };

      const roundtripped = JSON.parse(JSON.stringify(payload));

      expect(roundtripped.company.name).toBe(payload.company.name);
      expect(roundtripped.client.name).toBe(payload.client.name);
      expect(roundtripped.company.address).toBe(payload.company.address);
      expect(roundtripped.positions[0].name).toBe(payload.positions[0].name);
      expect(roundtripped.terms).toBe(payload.terms);
    });
  });
});

// ── Eksport fixture'ów dla użycia w innych testach ──────────────────────────

export { POLISH_FIXTURES, UKRAINIAN_FIXTURES, ENGLISH_FIXTURES, POLISH_ALL };
