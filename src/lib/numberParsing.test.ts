import { describe, it, expect } from 'vitest';
import { parseDecimal, isValidDecimal } from './numberParsing';

describe('parseDecimal', () => {
  describe('akceptuje przecinek jako separator dziesiętny', () => {
    it('parsuje "12,5" do 12.5', () => {
      expect(parseDecimal('12,5')).toBe(12.5);
    });

    it('parsuje "0,75" do 0.75', () => {
      expect(parseDecimal('0,75')).toBe(0.75);
    });

    it('parsuje "100,00" do 100', () => {
      expect(parseDecimal('100,00')).toBe(100);
    });
  });

  describe('akceptuje kropkę jako separator dziesiętny', () => {
    it('parsuje "12.5" do 12.5', () => {
      expect(parseDecimal('12.5')).toBe(12.5);
    });

    it('parsuje "0.75" do 0.75', () => {
      expect(parseDecimal('0.75')).toBe(0.75);
    });

    it('parsuje "100.00" do 100', () => {
      expect(parseDecimal('100.00')).toBe(100);
    });
  });

  describe('obsługuje liczby całkowite', () => {
    it('parsuje "100" do 100', () => {
      expect(parseDecimal('100')).toBe(100);
    });

    it('parsuje "0" do 0', () => {
      expect(parseDecimal('0')).toBe(0);
    });

    it('parsuje "1" do 1', () => {
      expect(parseDecimal('1')).toBe(1);
    });
  });

  describe('usuwa białe znaki', () => {
    it('parsuje "  12,5  " do 12.5', () => {
      expect(parseDecimal('  12,5  ')).toBe(12.5);
    });

    it('parsuje " 100 " do 100', () => {
      expect(parseDecimal(' 100 ')).toBe(100);
    });
  });

  describe('obsługuje niekompletne wprowadzanie (w trakcie pisania)', () => {
    it('parsuje "12," do 12 (separator bez dalszych cyfr)', () => {
      expect(parseDecimal('12,')).toBe(12);
    });

    it('parsuje "12." do 12', () => {
      expect(parseDecimal('12.')).toBe(12);
    });
  });

  describe('zwraca null dla nieprawidłowych wartości', () => {
    it('zwraca null dla pustego ciągu', () => {
      expect(parseDecimal('')).toBeNull();
    });

    it('zwraca null dla samych spacji', () => {
      expect(parseDecimal('   ')).toBeNull();
    });

    it('zwraca null dla tekstu alfabetycznego', () => {
      expect(parseDecimal('abc')).toBeNull();
    });

    it('zwraca null dla mieszanki liter i cyfr', () => {
      expect(parseDecimal('12abc')).toBeNull();
    });

    it('zwraca null gdy wiele separatorów (1,2,3)', () => {
      expect(parseDecimal('1,2,3')).toBeNull();
    });

    it('zwraca null gdy wiele separatorów (1.2.3)', () => {
      expect(parseDecimal('1.2.3')).toBeNull();
    });
  });
});

describe('isValidDecimal', () => {
  it('zwraca true dla "12,5"', () => {
    expect(isValidDecimal('12,5')).toBe(true);
  });

  it('zwraca true dla "12.5"', () => {
    expect(isValidDecimal('12.5')).toBe(true);
  });

  it('zwraca true dla "100"', () => {
    expect(isValidDecimal('100')).toBe(true);
  });

  it('zwraca false dla pustego ciągu', () => {
    expect(isValidDecimal('')).toBe(false);
  });

  it('zwraca false dla "abc"', () => {
    expect(isValidDecimal('abc')).toBe(false);
  });

  it('zwraca false dla "1,2,3"', () => {
    expect(isValidDecimal('1,2,3')).toBe(false);
  });
});
