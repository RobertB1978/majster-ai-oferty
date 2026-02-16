import { describe, it, expect } from 'vitest';
import pl from '../../i18n/locales/pl.json';
import en from '../../i18n/locales/en.json';
import uk from '../../i18n/locales/uk.json';

/**
 * i18n Locale Completeness Tests
 *
 * These tests ensure that all locale files (PL, EN, UK) have the same keys
 * and prevent regression where translations go missing.
 */

function getAllKeys(obj: Record<string, any>, prefix = ''): string[] {
  let keys: string[] = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function getValue(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((current: any, key) => current?.[key], obj);
}

describe('i18n Locale Completeness', () => {
  const plKeys = getAllKeys(pl);
  const enKeys = getAllKeys(en);
  const ukKeys = getAllKeys(uk);

  const allUniqueKeys = [...new Set([...plKeys, ...enKeys, ...ukKeys])];

  it('should have the same number of keys in all locales', () => {
    expect(plKeys.length).toBe(enKeys.length);
    expect(enKeys.length).toBe(ukKeys.length);
    expect(ukKeys.length).toBe(plKeys.length);
  });

  it('should have all keys present in Polish (PL)', () => {
    const missingKeys = allUniqueKeys.filter(key => !getValue(pl, key));
    expect(missingKeys).toEqual([]);
  });

  it('should have all keys present in English (EN)', () => {
    const missingKeys = allUniqueKeys.filter(key => !getValue(en, key));
    expect(missingKeys).toEqual([]);
  });

  it('should have all keys present in Ukrainian (UK)', () => {
    const missingKeys = allUniqueKeys.filter(key => !getValue(uk, key));
    expect(missingKeys).toEqual([]);
  });

  it('should not have any empty translations in Polish', () => {
    const emptyKeys = plKeys.filter(key => {
      const value = getValue(pl, key);
      return value === '' || value === null || value === undefined;
    });
    expect(emptyKeys).toEqual([]);
  });

  it('should not have any empty translations in English', () => {
    const emptyKeys = enKeys.filter(key => {
      const value = getValue(en, key);
      return value === '' || value === null || value === undefined;
    });
    expect(emptyKeys).toEqual([]);
  });

  it('should not have any empty translations in Ukrainian', () => {
    const emptyKeys = ukKeys.filter(key => {
      const value = getValue(uk, key);
      return value === '' || value === null || value === undefined;
    });
    expect(emptyKeys).toEqual([]);
  });

  describe('Critical keys exist (no raw keys visible)', () => {
    const criticalKeys = [
      'projects.searchPlaceholder',
      'projects.exportBtn',
      'projects.confirmDelete',
      'clients.confirmDelete',
      'clients.searchPlaceholder',
      'errors.pageNotFound',
      'errors.returnHome',
      'cookies.title',
      'cookies.acceptAll',
      'common.save',
      'common.cancel',
      'nav.dashboard',
      'nav.projects',
      'nav.clients',
      'nav.settings',
    ];

    criticalKeys.forEach(key => {
      it(`should have "${key}" in all locales`, () => {
        expect(getValue(pl, key)).toBeTruthy();
        expect(getValue(en, key)).toBeTruthy();
        expect(getValue(uk, key)).toBeTruthy();
      });
    });
  });

  it('should have consistent structure across all locales', () => {
    // Get the structure (keys) from each locale
    const plStructure = new Set(plKeys);
    const enStructure = new Set(enKeys);
    const ukStructure = new Set(ukKeys);

    // All locales should have the exact same keys
    expect([...plStructure].sort()).toEqual([...enStructure].sort());
    expect([...enStructure].sort()).toEqual([...ukStructure].sort());
  });

  it('should have at least 900 translation keys (sanity check)', () => {
    expect(plKeys.length).toBeGreaterThanOrEqual(900);
    expect(enKeys.length).toBeGreaterThanOrEqual(900);
    expect(ukKeys.length).toBeGreaterThanOrEqual(900);
  });
});
