import { describe, it, expect } from 'vitest';
import i18n from '../../i18n';
import plJson from '../../i18n/locales/pl.json';
import enJson from '../../i18n/locales/en.json';
import ukJson from '../../i18n/locales/uk.json';

/**
 * i18n Locale Completeness Tests
 *
 * These tests ensure that all locale files (PL, EN, UK) have complete translations
 * and prevent regression where translations go missing.
 */

describe('i18n Locale Completeness', () => {
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
    'common.delete',
    'nav.dashboard',
    'nav.projects',
    'nav.clients',
    'nav.settings',
    'dashboard.title',
    'settings.title',
  ];

  describe('Polish (PL) translations', () => {
    criticalKeys.forEach(key => {
      it(`should have "${key}" translated in Polish`, () => {
        i18n.changeLanguage('pl');
        const translation = i18n.t(key);
        expect(translation).toBeTruthy();
        expect(translation).not.toBe(key); // Should not return the key itself
        // Check that it's not a raw key pattern (word.word)
        expect(translation).not.toMatch(/^[a-z]+\.[a-z]+/i);
      });
    });
  });

  describe('English (EN) translations', () => {
    criticalKeys.forEach(key => {
      it(`should have "${key}" translated in English`, () => {
        i18n.changeLanguage('en');
        const translation = i18n.t(key);
        expect(translation).toBeTruthy();
        expect(translation).not.toBe(key);
        // Check that it's not a raw key pattern (word.word)
        expect(translation).not.toMatch(/^[a-z]+\.[a-z]+/i);
      });
    });
  });

  describe('Ukrainian (UK) translations', () => {
    criticalKeys.forEach(key => {
      it(`should have "${key}" translated in Ukrainian`, () => {
        i18n.changeLanguage('uk');
        const translation = i18n.t(key);
        expect(translation).toBeTruthy();
        expect(translation).not.toBe(key);
        // Check that it's not a raw key pattern (word.word)
        expect(translation).not.toMatch(/^[a-z]+\.[a-z]+/i);
      });
    });
  });

  describe('Structural key parity (CI guard)', () => {
    /** Recursively collect all dot-path keys from a JSON object */
    function collectKeys(obj: Record<string, unknown>, prefix = ''): string[] {
      return Object.entries(obj).flatMap(([k, v]) => {
        const path = prefix ? `${prefix}.${k}` : k;
        return v && typeof v === 'object' && !Array.isArray(v)
          ? collectKeys(v as Record<string, unknown>, path)
          : [path];
      });
    }

    it('English should have all keys from Polish', () => {
      const plKeys = new Set(collectKeys(plJson as Record<string, unknown>));
      const enKeys = new Set(collectKeys(enJson as Record<string, unknown>));
      const missing = [...plKeys].filter(k => !enKeys.has(k));
      expect(missing, `Missing EN keys: ${missing.join(', ')}`).toHaveLength(0);
    });

    it('Ukrainian should have all keys from Polish', () => {
      const plKeys = new Set(collectKeys(plJson as Record<string, unknown>));
      const ukKeys = new Set(collectKeys(ukJson as Record<string, unknown>));
      const missing = [...plKeys].filter(k => !ukKeys.has(k));
      expect(missing, `Missing UK keys: ${missing.join(', ')}`).toHaveLength(0);
    });

    it('Sprint 2 addon keys should exist in all locales', () => {
      const addonKeys = ['addons.title', 'addons.subtitle', 'addons.buy', 'addons.purchaseSuccess'];
      for (const key of addonKeys) {
        ['pl', 'en', 'uk'].forEach(lang => {
          i18n.changeLanguage(lang);
          const val = i18n.t(key);
          expect(val, `${lang}:${key} should be translated`).not.toBe(key);
        });
      }
    });

    it('Sprint 2 phone auth keys should exist in all locales', () => {
      const phoneKeys = ['auth.phone', 'auth.errors.invalidPhone', 'auth.errors.phoneTaken'];
      for (const key of phoneKeys) {
        ['pl', 'en', 'uk'].forEach(lang => {
          i18n.changeLanguage(lang);
          const val = i18n.t(key);
          expect(val, `${lang}:${key} should be translated`).not.toBe(key);
        });
      }
    });
  });

  describe('Language switching consistency', () => {
    it('should switch languages correctly', () => {
      // Test Polish
      i18n.changeLanguage('pl');
      expect(i18n.t('common.save')).toBe('Zapisz');

      // Test English
      i18n.changeLanguage('en');
      expect(i18n.t('common.save')).toBe('Save');

      // Test Ukrainian
      i18n.changeLanguage('uk');
      expect(i18n.t('common.save')).toBe('Зберегти');
    });

    it('should translate critical user-reported keys consistently', () => {
      // projects.searchPlaceholder
      i18n.changeLanguage('pl');
      expect(i18n.t('projects.searchPlaceholder')).toBe('Szukaj projektów...');

      i18n.changeLanguage('en');
      expect(i18n.t('projects.searchPlaceholder')).toBe('Search projects...');

      i18n.changeLanguage('uk');
      expect(i18n.t('projects.searchPlaceholder')).toBe('Пошук проєктів...');

      // clients.confirmDelete
      i18n.changeLanguage('pl');
      expect(i18n.t('clients.confirmDelete')).toBe('Czy na pewno chcesz usunąć tego klienta?');

      i18n.changeLanguage('en');
      expect(i18n.t('clients.confirmDelete')).toBe('Are you sure you want to delete this client?');

      i18n.changeLanguage('uk');
      expect(i18n.t('clients.confirmDelete')).toBe('Ви впевнені, що хочете видалити цього клієнта?');
    });
  });
});
